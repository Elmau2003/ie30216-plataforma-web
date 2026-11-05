// backend/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// 1. Crear una Evaluación/Tarea en un Salón (DOCENTE y DIRECTIVO)
router.post('/evaluaciones', permitirRoles('DOCENTE', 'DIRECTIVO'), async (req, res) => {
  const { salonId, titulo, fecha } = req.body;
  const docenteId = req.usuario.id;

  if (!salonId || !titulo || !fecha) {
    return res.status(400).json({ mensaje: 'Todos los campos de la evaluación son requeridos' });
  }

  try {
    const query = `
      INSERT INTO evaluaciones (salon_id, docente_id, titulo, fecha)
      VALUES ($1, $2, $3, $4)
      RETURNING id, salon_id, titulo, fecha
    `;
    const result = await db.query(query, [salonId, docenteId, titulo, fecha]);
    res.status(201).json({ mensaje: 'Evaluación creada con éxito', evaluacion: result.rows[0] });
  } catch (error) {
    console.error('Error al crear evaluación:', error);
    res.status(500).json({ mensaje: 'Error interno al registrar evaluación' });
  }
});

// 2. Registrar/Actualizar Notas cualitativas (AD, A, B, C)
router.post('/registrar-notas', permitirRoles('DOCENTE', 'DIRECTIVO'), async (req, res) => {
  const { evaluacionId, notas } = req.body;
  // notas es un array: [{ estudianteId: 3, calificacionLetra: 'AD', observaciones: 'Excelente desempeño' }]

  if (!evaluacionId || !Array.isArray(notas) || notas.length === 0) {
    return res.status(400).json({ mensaje: 'Datos de notas incompletos' });
  }

  try {
    await db.query('BEGIN');

    for (const item of notas) {
      const query = `
        INSERT INTO notas (evaluacion_id, estudiante_id, calificacion_letra, observaciones)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (evaluacion_id, estudiante_id)
        DO UPDATE SET calificacion_letra = EXCLUDED.calificacion_letra,
                      observaciones = EXCLUDED.observaciones,
                      fecha_registro = CURRENT_TIMESTAMP
      `;
      await db.query(query, [evaluacionId, item.estudianteId, item.calificacionLetra, item.observaciones || null]);
    }

    await db.query('COMMIT');
    res.json({ mensaje: 'Notas registradas correctamente' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al guardar notas:', error);
    res.status(500).json({ mensaje: 'Error interno al registrar las notas' });
  }
});

// 3. Ver Libreta/Boleta de un Estudiante (Disponible para ESTUDIANTE, DOCENTE, DIRECTIVO)
router.get('/estudiante/:estudianteId', async (req, res) => {
  const { estudianteId } = req.params;

  // Si el rol es ESTUDIANTE, validar que solo pueda ver su propia libreta
  if (req.usuario.rol === 'ESTUDIANTE' && parseInt(estudianteId) !== req.usuario.id) {
    return res.status(403).json({ mensaje: 'No tienes permiso para ver la libreta de otro estudiante' });
  }

  try {
    const query = `
      SELECT e.titulo AS evaluacion, e.fecha, n.calificacion_letra, n.observaciones, s.grado, s.seccion
      FROM notas n
      JOIN evaluaciones e ON n.evaluacion_id = e.id
      JOIN salones s ON e.salon_id = s.id
      WHERE n.estudiante_id = $1
      ORDER BY e.fecha DESC
    `;
    const result = await db.query(query, [estudianteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener la libreta:', error);
    res.status(500).json({ mensaje: 'Error al obtener la información de notas' });
  }
});

module.exports = router;