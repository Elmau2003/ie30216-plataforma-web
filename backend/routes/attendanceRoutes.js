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

module.exports = router;