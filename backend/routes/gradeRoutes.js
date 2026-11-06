const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// 1. Crear una Evaluación/Tarea asociada a un Salón y Curso (DOCENTE y DIRECTIVO)
router.post('/evaluaciones', permitirRoles('DOCENTE', 'DIRECTIVO'), async (req, res) => {
  const { salonId, curso, titulo, fecha } = req.body;
  const docenteId = req.usuario.id;

  if (!salonId || !curso || !titulo || !fecha) {
    return res.status(400).json({ mensaje: 'Todos los campos (salón, curso, título, fecha) son requeridos' });
  }

  try {
    const query = `
      INSERT INTO evaluaciones (salon_id, docente_id, curso, titulo, fecha)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, salon_id, curso, titulo, fecha
    `;
    const result = await db.query(query, [salonId, docenteId, curso, titulo, fecha]);
    res.status(201).json({ mensaje: 'Evaluación creada con éxito', evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error al crear evaluación:', error);
    res.status(500).json({ mensaje: 'Error interno al registrar evaluación' });
  }
});

// 2. Registrar/Actualizar Notas cualitativas (permite NULL para desmarcar o estudiantes sin evaluar)
router.post('/registrar-notas', permitirRoles('DOCENTE', 'DIRECTIVO'), async (req, res) => {
  const { evaluacionId, notas } = req.body;

  if (!evaluacionId || !Array.isArray(notas)) {
    return res.status(400).json({ mensaje: 'Datos de notas incompletos' });
  }

  try {
    await db.query('BEGIN');

    for (const item of notas) {
      // Convertir valores vacíos o undefined a NULL
      const calificacion = item.calificacionLetra && String(item.calificacionLetra).trim() !== ''
        ? item.calificacionLetra
        : null;

      const obs = item.observaciones && String(item.observaciones).trim() !== ''
        ? item.observaciones
        : null;

      const query = `
        INSERT INTO notas (evaluacion_id, estudiante_id, calificacion_letra, observaciones)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (evaluacion_id, estudiante_id)
        DO UPDATE SET calificacion_letra = EXCLUDED.calificacion_letra,
                      observaciones = EXCLUDED.observaciones,
                      fecha_registro = CURRENT_TIMESTAMP
      `;
      await db.query(query, [evaluacionId, item.estudianteId, calificacion, obs]);
    }

    await db.query('COMMIT');
    res.json({ mensaje: 'Notas registradas correctamente' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al guardar notas:', error);
    res.status(500).json({ mensaje: 'Error interno al registrar las notas' });
  }
});

// 3. Obtener notas previamente registradas en una evaluación (para cargar en el modal)
router.get('/evaluacion/:evaluacionId', async (req, res) => {
  const { evaluacionId } = req.params;

  try {
    const query = `
      SELECT estudiante_id, calificacion_letra, observaciones
      FROM notas
      WHERE evaluacion_id = $1
    `;
    const result = await db.query(query, [evaluacionId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener notas de la evaluación:', error);
    res.status(500).json({ mensaje: 'Error al obtener las notas registradas' });
  }
});

// 4. Ver Libreta/Boleta de un Estudiante
router.get('/estudiante/:estudianteId', async (req, res) => {
  const { estudianteId } = req.params;

  if (req.usuario.rol === 'ESTUDIANTE' && parseInt(estudianteId) !== req.usuario.id) {
    return res.status(403).json({ mensaje: 'No tienes permiso para ver la libreta de otro estudiante' });
  }

  try {
    const query = `
      SELECT e.curso, e.titulo AS evaluacion, e.fecha, n.calificacion_letra, n.observaciones, s.grado, s.seccion
      FROM notas n
      JOIN evaluaciones e ON n.evaluacion_id = e.id
      JOIN salones s ON e.salon_id = s.id
      WHERE n.estudiante_id = $1
      ORDER BY e.curso ASC, e.fecha DESC
    `;
    const result = await db.query(query, [estudianteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener la libreta:', error);
    res.status(500).json({ mensaje: 'Error al obtener la información de notas' });
  }
});

// 5. Obtener todas las evaluaciones registradas en un salón
router.get('/evaluaciones/salon/:salonId', async (req, res) => {
  const { salonId } = req.params;

  try {
    const query = `
      SELECT e.id, e.curso, e.titulo, TO_CHAR(e.fecha, 'YYYY-MM-DD') AS fecha,
             CONCAT(u.nombres, ' ', u.apellidos) AS docente
      FROM evaluaciones e
      JOIN usuarios u ON e.docente_id = u.id
      WHERE e.salon_id = $1
      ORDER BY e.curso ASC, e.fecha DESC
    `;
    const result = await db.query(query, [salonId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar evaluaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener la lista de evaluaciones' });
  }
});

// 6. Consultar el registro consolidado de notas por curso para un salón (para exportación en Excel)
router.get('/reporte-curso/:salonId', async (req, res) => {
  const { salonId } = req.params;
  const { curso } = req.query;

  if (!curso || curso === 'TODOS') {
    return res.status(400).json({ mensaje: 'Debe seleccionar un curso específico para exportar' });
  }

  try {
    // 1. Obtener todas las evaluaciones del curso ordenadas por fecha
    const evQuery = `
      SELECT id, titulo, TO_CHAR(fecha, 'DD/MM/YYYY') AS fecha_fmt
      FROM evaluaciones
      WHERE salon_id = $1 AND curso = $2
      ORDER BY fecha ASC, id ASC
    `;
    const evResult = await db.query(evQuery, [salonId, curso]);

    // 2. Obtener estudiantes matriculados y sus notas asociadas a las evaluaciones del curso
    const notasQuery = `
      SELECT 
        u.id AS estudiante_id,
        u.dni,
        u.nombres,
        u.apellidos,
        n.evaluacion_id,
        n.calificacion_letra
      FROM matriculas m
      JOIN usuarios u ON m.estudiante_id = u.id
      LEFT JOIN evaluaciones e ON e.salon_id = m.salon_id AND e.curso = $2
      LEFT JOIN notas n ON n.evaluacion_id = e.id AND n.estudiante_id = u.id
      WHERE m.salon_id = $1
      ORDER BY u.apellidos ASC, u.nombres ASC
    `;
    const notasResult = await db.query(notasQuery, [salonId, curso]);

    res.json({
      evaluaciones: evResult.rows,
      registros: notasResult.rows,
    });
  } catch (error) {
    console.error('Error al generar reporte de notas por curso:', error);
    res.status(500).json({ mensaje: 'Error al obtener reporte de notas' });
  }
});

module.exports = router;