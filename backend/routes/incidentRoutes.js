// backend/routes/incidentRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// 1. Registrar una nueva incidencia (DOCENTE)
router.post('/', permitirRoles('DOCENTE'), async (req, res) => {
  const { estudianteId, salonId, tipo, descripcion } = req.body;
  const docenteId = req.usuario.id;

  if (!estudianteId || !tipo || !descripcion) {
    return res.status(400).json({ mensaje: 'Estudiante, tipo de incidencia y descripción son requeridos' });
  }

  try {
    const query = `
      INSERT INTO incidencias (docente_id, estudiante_id, salon_id, tipo, descripcion)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const sId = salonId ? parseInt(salonId) : null;
    const result = await db.query(query, [docenteId, parseInt(estudianteId), sId, tipo, descripcion]);

    res.status(201).json({ mensaje: 'Incidencia registrada correctamente', incidencia: result.rows[0] });
  } catch (error) {
    console.error('Error al registrar incidencia:', error.message);
    res.status(500).json({ mensaje: 'Error interno al registrar la incidencia' });
  }
});

// 2. Obtener lista de estudiantes matriculados en un salón (para el desplegable del modal)
router.get('/estudiantes-salon/:salonId', permitirRoles('DOCENTE', 'DIRECTIVO'), async (req, res) => {
  const { salonId } = req.params;

  try {
    const query = `
      SELECT u.id, u.dni, u.nombres, u.apellidos
      FROM matriculas m
      JOIN usuarios u ON m.estudiante_id = u.id
      WHERE m.salon_id = $1
      ORDER BY u.apellidos ASC, u.nombres ASC
    `;
    const result = await db.query(query, [salonId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar estudiantes del salón:', error.message);
    res.status(500).json({ mensaje: 'Error al consultar lista de estudiantes' });
  }
});

// 3. Historial de incidencias registradas por el docente en sesión (DOCENTE)
router.get('/docente/mis-reportes', permitirRoles('DOCENTE'), async (req, res) => {
  const docenteId = req.usuario.id;
  try {
    const query = `
      SELECT i.id, i.tipo, i.descripcion,
             TO_CHAR(i.fecha_registro, 'DD/MM/YYYY HH24:MI') AS fecha,
             CONCAT(est.apellidos, ', ', est.nombres) AS estudiante_nombre, est.dni AS estudiante_dni,
             CONCAT(s.grado, ' "', s.seccion, '"') AS salon_nombre
      FROM incidencias i
      JOIN usuarios est ON i.estudiante_id = est.id
      LEFT JOIN salones s ON i.salon_id = s.id
      WHERE i.docente_id = $1
      ORDER BY i.fecha_registro DESC
    `;
    const result = await db.query(query, [docenteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar reportes del docente:', error.message);
    res.status(500).json({ mensaje: 'Error al consultar historial de incidencias' });
  }
});

// 4. Mis incidencias recibidas (ESTUDIANTE)
router.get('/estudiante/mis-incidencias', permitirRoles('ESTUDIANTE'), async (req, res) => {
  const estudianteId = req.usuario.id;
  try {
    const query = `
      SELECT i.id, i.tipo, i.descripcion,
             TO_CHAR(i.fecha_registro, 'DD/MM/YYYY HH24:MI') AS fecha,
             CONCAT(doc.nombres, ' ', doc.apellidos) AS docente_nombre
      FROM incidencias i
      JOIN usuarios doc ON i.docente_id = doc.id
      WHERE i.estudiante_id = $1
      ORDER BY i.fecha_registro DESC
    `;
    const result = await db.query(query, [estudianteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar incidencias del estudiante:', error.message);
    res.status(500).json({ mensaje: 'Error al obtener incidencias registradas' });
  }
});

module.exports = router;