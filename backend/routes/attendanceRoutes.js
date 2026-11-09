// backend/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// 1. Registrar o actualizar asistencia masiva de un salón (DOCENTE y DIRECTIVO)
router.post('/registrar', permitirRoles('DOCENTE', 'DIRECTIVO'), async (req, res) => {
  const { salonId, fecha, asistencias } = req.body; 
  // asistencias es un array: [{ estudianteId: 3, estado: 'PRESENTE' }, ...]
  const registradoPor = req.usuario.id;

  if (!salonId || !fecha || !Array.isArray(asistencias) || asistencias.length === 0) {
    return res.status(400).json({ mensaje: 'Datos de asistencia incompletos' });
  }

  try {
    // Iniciar transacción SQL para guardar todos los registros juntos
    await db.query('BEGIN');

    for (const item of asistencias) {
      const query = `
        INSERT INTO asistencias (estudiante_id, salon_id, registrado_por, fecha, estado)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (estudiante_id, salon_id, fecha)
        DO UPDATE SET estado = EXCLUDED.estado, registrado_por = EXCLUDED.registrado_por
      `;
      await db.query(query, [item.estudianteId, salonId, registradoPor, fecha, item.estado]);
    }

    await db.query('COMMIT');
    res.json({ mensaje: 'Asistencia registrada correctamente' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ mensaje: 'Error interno al guardar la asistencia' });
  }
});

// 2. Consultar asistencia por salón y fecha
router.get('/salon/:salonId', async (req, res) => {
  const { salonId } = req.params;
  const { fecha } = req.query; // Formato: YYYY-MM-DD

  if (!fecha) {
    return res.status(400).json({ mensaje: 'Debe proporcionar la fecha a consultar' });
  }

  try {
    const query = `
      SELECT u.id AS estudiante_id, u.dni, u.nombres, u.apellidos,
             COALESCE(a.estado, 'PRESENTE') AS estado
      FROM matriculas m
      JOIN usuarios u ON m.estudiante_id = u.id
      LEFT JOIN asistencias a ON a.estudiante_id = u.id AND a.salon_id = $1 AND a.fecha = $2
      WHERE m.salon_id = $1
      ORDER BY u.apellidos ASC
    `;
    const result = await db.query(query, [salonId, fecha]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar asistencia:', error);
    res.status(500).json({ mensaje: 'Error al obtener la asistencia' });
  }
});

// 3. Consultar asistencia completa de un mes para exportación
router.get('/salon/:salonId/mes', async (req, res) => {
  const { salonId } = req.params;
  const { anio, mes } = req.query; // Ejemplo: anio=2026&mes=11

  if (!anio || !mes) {
    return res.status(400).json({ mensaje: 'Debe proporcionar el año y el mes' });
  }

  try {
    const query = `
      SELECT 
        u.id AS estudiante_id,
        u.dni,
        u.nombres,
        u.apellidos,
        TO_CHAR(a.fecha, 'YYYY-MM-DD') AS fecha,
        a.estado
      FROM matriculas m
      JOIN usuarios u ON m.estudiante_id = u.id
      LEFT JOIN asistencias a ON a.estudiante_id = u.id 
        AND a.salon_id = $1 
        AND EXTRACT(YEAR FROM a.fecha) = $2 
        AND EXTRACT(MONTH FROM a.fecha) = $3
      WHERE m.salon_id = $1
      ORDER BY u.apellidos ASC, u.nombres ASC
    `;
    const result = await db.query(query, [salonId, parseInt(anio), parseInt(mes)]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar asistencia mensual:', error);
    res.status(500).json({ mensaje: 'Error al obtener la asistencia del mes' });
  }
});

router.post('/registrar', permitirRoles('DOCENTE', 'DIRECTIVO'), async (req, res) => {
  const { salonId, fecha, asistencias } = req.body;
  const registradoPor = req.usuario.id;

  if (!salonId || !fecha || !Array.isArray(asistencias) || asistencias.length === 0) {
    return res.status(400).json({ mensaje: 'Datos de asistencia incompletos' });
  }

  // Validar fin de semana en Backend (0: Domingo, 6: Sábado)
  const fechaObj = new Date(fecha + 'T00:00:00');
  const diaSemana = fechaObj.getDay();
  if (diaSemana === 0 || diaSemana === 6) {
    return res.status(400).json({ mensaje: 'No está permitido registrar asistencias en sábados o domingos' });
  }

  try {
    await db.query('BEGIN');
    for (const item of asistencias) {
      const query = `
        INSERT INTO asistencias (estudiante_id, salon_id, registrado_por, fecha, estado)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (estudiante_id, salon_id, fecha)
        DO UPDATE SET estado = EXCLUDED.estado, registrado_por = EXCLUDED.registrado_por
      `;
      await db.query(query, [item.estudianteId, salonId, registradoPor, fecha, item.estado]);
    }
    await db.query('COMMIT');
    res.json({ mensaje: 'Asistencia registrada correctamente' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ mensaje: 'Error interno al guardar la asistencia' });
  }
});

// Consultar el récord de asistencias de un estudiante
router.get('/estudiante/:estudianteId', async (req, res) => {
  const { estudianteId } = req.params;

  if (req.usuario.rol === 'ESTUDIANTE' && parseInt(estudianteId) !== req.usuario.id) {
    return res.status(403).json({ mensaje: 'No tienes permiso para ver asistencias de otro estudiante' });
  }

  try {
    const query = `
      SELECT TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, estado
      FROM asistencias
      WHERE estudiante_id = $1
      ORDER BY fecha DESC
    `;
    const result = await db.query(query, [estudianteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener asistencias del estudiante:', error);
    res.status(500).json({ mensaje: 'Error al obtener récord de asistencias' });
  }
});

module.exports = router;