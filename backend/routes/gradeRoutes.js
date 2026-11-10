// backend/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// 1. Crear una Evaluación asociada a un Salón, Curso y Bimestre (DOCENTE y DIRECTIVO)
router.post('/evaluaciones', permitirRoles('DOCENTE', 'DIRECTIVO'), async (req, res) => {
  const { salonId, curso, titulo, fecha, periodo } = req.body;
  const docenteId = req.usuario.id;
  const anioActual = new Date().getFullYear();

  if (!salonId || !curso || !titulo || !fecha || !periodo) {
    return res.status(400).json({ mensaje: 'Todos los campos (salón, curso, título, fecha y período/bimestre) son requeridos' });
  }

  try {
    // Validar que el salón pertenezca al año lectivo actual
    const salonCheck = await db.query('SELECT anio_escolar FROM salones WHERE id = $1', [salonId]);
    if (salonCheck.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El salón seleccionado no existe' });
    }
    if (salonCheck.rows[0].anio_escolar !== anioActual) {
      return res.status(400).json({ mensaje: `No se pueden registrar evaluaciones para años pasados (${salonCheck.rows[0].anio_escolar}).` });
    }

    const query = `
      INSERT INTO evaluaciones (salon_id, docente_id, curso, titulo, fecha, periodo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, salon_id, curso, titulo, fecha, periodo
    `;
    const result = await db.query(query, [salonId, docenteId, curso, titulo, fecha, periodo]);
    res.status(201).json({ mensaje: 'Evaluación creada con éxito', evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error al crear evaluación:', error.message);
    res.status(500).json({ mensaje: 'Error interno al registrar evaluación' });
  }
});

// 2. Registrar/Actualizar Notas cualitativas
router.post('/registrar-notas', permitirRoles('DOCENTE', 'DIRECTIVO'), async (req, res) => {
  const { evaluacionId, notas } = req.body;

  if (!evaluacionId || !Array.isArray(notas)) {
    return res.status(400).json({ mensaje: 'Datos de notas incompletos' });
  }

  try {
    await db.query('BEGIN');

    for (const item of notas) {
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
    console.error('Error al guardar notas:', error.message);
    res.status(500).json({ mensaje: 'Error interno al registrar las notas' });
  }
});

// 3. Obtener notas previamente registradas en una evaluación
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
    console.error('Error al obtener notas de la evaluación:', error.message);
    res.status(500).json({ mensaje: 'Error al obtener las notas registradas' });
  }
});

// 4. Ver Libreta/Boleta de un Estudiante por Año Escolar y Bimestres
router.get('/estudiante/:estudianteId', async (req, res) => {
  const { estudianteId } = req.params;
  const anio = req.query.anio || new Date().getFullYear();

  if (req.usuario.rol === 'ESTUDIANTE' && parseInt(estudianteId) !== req.usuario.id) {
    return res.status(403).json({ mensaje: 'No tienes permiso para ver la libreta de otro estudiante' });
  }

  try {
    const query = `
      SELECT e.curso, e.titulo AS evaluacion, TO_CHAR(e.fecha, 'DD/MM/YYYY') AS fecha,
             COALESCE(e.periodo, 'I Bimestre') AS periodo,
             n.calificacion_letra, n.observaciones, s.grado, s.seccion, s.anio_escolar
      FROM matriculas m
      JOIN salones s ON m.salon_id = s.id
      JOIN evaluaciones e ON e.salon_id = s.id
      LEFT JOIN notas n ON n.evaluacion_id = e.id AND n.estudiante_id = m.estudiante_id
      WHERE m.estudiante_id = $1 AND s.anio_escolar = $2
      ORDER BY e.periodo ASC, e.curso ASC, e.fecha DESC
    `;
    const result = await db.query(query, [estudianteId, parseInt(anio)]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener la libreta:', error.message);
    res.status(500).json({ mensaje: 'Error al obtener la información de notas' });
  }
});

// 4.1. Consultar historial de años en los que el estudiante estuvo matriculado
router.get('/estudiante/:estudianteId/anios-historial', async (req, res) => {
  const { estudianteId } = req.params;
  try {
    const query = `
      SELECT DISTINCT s.anio_escolar, s.grado, s.seccion
      FROM matriculas m
      JOIN salones s ON m.salon_id = s.id
      WHERE m.estudiante_id = $1
      ORDER BY s.anio_escolar DESC
    `;
    const result = await db.query(query, [estudianteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar años del historial:', error.message);
    res.status(500).json({ mensaje: 'Error al consultar historial del estudiante' });
  }
});

// 5. Obtener evaluaciones registradas en un salón (Con filtro opcional por Bimestre)
router.get('/evaluaciones/salon/:salonId', async (req, res) => {
  const { salonId } = req.params;
  const { periodo } = req.query;

  try {
    let query = `
      SELECT e.id, e.curso, e.titulo, TO_CHAR(e.fecha, 'YYYY-MM-DD') AS fecha,
             COALESCE(e.periodo, 'I Bimestre') AS periodo,
             CONCAT(u.nombres, ' ', u.apellidos) AS docente
      FROM evaluaciones e
      JOIN usuarios u ON e.docente_id = u.id
      WHERE e.salon_id = $1
    `;
    const params = [salonId];

    if (periodo && periodo !== 'TODOS') {
      query += ` AND e.periodo = $2`;
      params.push(periodo);
    }

    query += ` ORDER BY e.fecha DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar evaluaciones:', error.message);
    res.status(500).json({ mensaje: 'Error al obtener la lista de evaluaciones' });
  }
});

// 6. Reporte consolidado de notas por curso y bimestre a Excel
router.get('/reporte-curso/:salonId', async (req, res) => {
  const { salonId } = req.params;
  const { curso, periodo } = req.query;

  if (!curso || curso === 'TODOS') {
    return res.status(400).json({ mensaje: 'Debe seleccionar un curso específico para exportar' });
  }

  try {
    let evQuery = `
      SELECT id, titulo, TO_CHAR(fecha, 'DD/MM/YYYY') AS fecha_fmt, COALESCE(periodo, 'I Bimestre') AS periodo
      FROM evaluaciones
      WHERE salon_id = $1 AND curso = $2
    `;
    const evParams = [salonId, curso];

    if (periodo && periodo !== 'TODOS') {
      evQuery += ` AND periodo = $3`;
      evParams.push(periodo);
    }
    evQuery += ` ORDER BY fecha ASC, id ASC`;

    const evResult = await db.query(evQuery, evParams);

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
    console.error('Error al generar reporte de notas por curso:', error.message);
    res.status(500).json({ mensaje: 'Error al obtener reporte de notas' });
  }
});

module.exports = router;