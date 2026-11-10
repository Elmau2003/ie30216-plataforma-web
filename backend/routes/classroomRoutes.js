// backend/routes/classroomRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// ==================== 1. RUTAS ESPECÍFICAS (DEBEN IR PRIMERO) ====================

// 1.1 Obtener EL SALÓN ASIGNADO al docente en el año actual (DOCENTE)
router.get('/mi-salon-asignado', permitirRoles('DOCENTE'), async (req, res) => {
  const docenteId = req.usuario.id;
  const anio = req.query.anio || new Date().getFullYear();

  try {
    const query = `
      SELECT s.id, s.grado, s.seccion, s.anio_escolar
      FROM salon_docente sd
      JOIN salones s ON sd.salon_id = s.id
      WHERE sd.docente_id = $1 AND s.anio_escolar = $2
      LIMIT 1
    `;
    const result = await db.query(query, [docenteId, parseInt(anio)]);

    if (result.rows.length === 0) {
      return res.json({ asignado: false, mensaje: 'No tiene un salón asignado para este año escolar.' });
    }

    res.json({ asignado: true, salon: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener salón del docente:', error.message);
    res.status(500).json({ mensaje: 'Error al consultar salón asignado' });
  }
});

// 1.2 Asignar Docente a un Salón (DIRECTIVO y ADMINISTRATIVO)
router.post('/asignar-docente', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  const { salonId, docenteId } = req.body;

  if (!salonId || !docenteId) {
    return res.status(400).json({ mensaje: 'Debe especificar el salón y el docente' });
  }

  try {
    const docQuery = `
      SELECT u.id FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1 AND UPPER(r.nombre) = 'DOCENTE'
    `;
    const docCheck = await db.query(docQuery, [docenteId]);
    if (docCheck.rows.length === 0) {
      return res.status(400).json({ mensaje: 'El usuario seleccionado no tiene rol de DOCENTE' });
    }

    const query = `
      INSERT INTO salon_docente (salon_id, docente_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `;
    await db.query(query, [salonId, docenteId]);

    res.json({ mensaje: 'Docente asignado al salón correctamente' });
  } catch (error) {
    console.error('Error al asignar docente:', error.message);
    res.status(500).json({ mensaje: 'Error al asignar docente al salón' });
  }
});

// 1.3 Matricular Estudiante en un Salón (DIRECTIVO y ADMINISTRATIVO)
router.post('/matricular', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  const { estudianteId, salonId } = req.body;

  if (!estudianteId || !salonId) {
    return res.status(400).json({ mensaje: 'Debe especificar el estudiante y el salón' });
  }

  try {
    const query = `
      INSERT INTO matriculas (estudiante_id, salon_id)
      VALUES ($1, $2)
      RETURNING id, estudiante_id, salon_id
    `;
    const result = await db.query(query, [estudianteId, salonId]);
    res.status(201).json({ mensaje: 'Estudiante matriculado exitosamente', matricula: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ mensaje: 'El estudiante ya se encuentra matriculado en este salón' });
    }
    console.error('Error al matricular estudiante:', error.message);
    res.status(500).json({ mensaje: 'Error interno al realizar la matrícula' });
  }
});

// ==================== 2. RUTAS GENERALES ====================

// 2.1 Crear un Salón (DIRECTIVO y ADMINISTRATIVO)
router.post('/', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  const { grado, seccion, anioEscolar } = req.body;

  if (!grado || !seccion || !anioEscolar) {
    return res.status(400).json({ mensaje: 'Todos los campos (grado, sección, año escolar) son obligatorios' });
  }

  try {
    const query = `
      INSERT INTO salones (grado, seccion, anio_escolar)
      VALUES ($1, $2, $3)
      RETURNING id, grado, seccion, anio_escolar
    `;
    const result = await db.query(query, [grado, seccion, parseInt(anioEscolar)]);
    res.status(201).json({ mensaje: 'Salón creado exitosamente', salon: result.rows[0] });
  } catch (error) {
    console.error('Error al crear salón:', error.message);
    res.status(500).json({ mensaje: 'Error al registrar el salón' });
  }
});

// 2.2 Listar Salones (Filtrado opcional por año)
router.get('/', async (req, res) => {
  const { anio } = req.query;
  try {
    let query = `
      SELECT 
        s.id, 
        s.grado, 
        s.seccion, 
        s.anio_escolar,
        COUNT(DISTINCT m.estudiante_id) AS total_estudiantes,
        COALESCE(
          STRING_AGG(DISTINCT CONCAT(u.nombres, ' ', u.apellidos), ', '), 
          'Sin docente asignado'
        ) AS docentes_asignados
      FROM salones s
      LEFT JOIN matriculas m ON s.id = m.salon_id
      LEFT JOIN salon_docente sd ON s.id = sd.salon_id
      LEFT JOIN usuarios u ON sd.docente_id = u.id
    `;
    const params = [];

    if (anio) {
      query += ` WHERE s.anio_escolar = $1`;
      params.push(parseInt(anio));
    }

    query += `
      GROUP BY s.id
      ORDER BY s.anio_escolar DESC, s.grado ASC, s.seccion ASC
    `;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar salones:', error.message);
    res.status(500).json({ mensaje: 'Error al obtener la lista de salones' });
  }
});

module.exports = router;