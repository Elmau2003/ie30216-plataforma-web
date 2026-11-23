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
  const anio = parseInt(req.query.anio, 10) || new Date().getFullYear();

  try {
    const query = `
      SELECT s.id, s.grado, s.seccion, s.anio_escolar
      FROM salon_docente sd
      JOIN salones s ON sd.salon_id = s.id
      WHERE sd.docente_id = $1 AND s.anio_escolar = $2
      LIMIT 1
    `;
    const result = await db.query(query, [docenteId, anio]);

    if (result.rows.length === 0) {
      return res.json({ asignado: false, mensaje: 'No tiene un salón asignado para este año escolar.' });
    }

    res.json({ asignado: true, salon: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener salón del docente:', error);
    res.status(500).json({ mensaje: 'Error al consultar salón asignado' });
  }
});

// 1.2 Asignar Docente a un Salón (DIRECTIVO y ADMINISTRATIVO)
router.post('/asignar-docente', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  const salonIdNum = parseInt(req.body.salonId, 10);
  const docenteIdNum = parseInt(req.body.docenteId, 10);

  if (Number.isNaN(salonIdNum) || Number.isNaN(docenteIdNum)) {
    return res.status(400).json({ mensaje: 'Debe especificar un salón y un docente válidos' });
  }

  try {
    // Verificar que el salón exista
    const salonCheck = await db.query('SELECT id FROM salones WHERE id = $1', [salonIdNum]);
    if (salonCheck.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El salón seleccionado no existe' });
    }

    // Verificar que el usuario exista y tenga rol DOCENTE
    const docQuery = `
      SELECT u.id, u.activo, r.nombre AS rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `;
    const docCheck = await db.query(docQuery, [docenteIdNum]);
    if (docCheck.rows.length === 0) {
      return res.status(404).json({ mensaje: 'El docente seleccionado no existe' });
    }

    const rolUsuario = String(docCheck.rows[0].rol || '').trim().toUpperCase();
    if (rolUsuario !== 'DOCENTE') {
      return res.status(400).json({ mensaje: 'El usuario seleccionado no tiene rol de DOCENTE' });
    }

    const insertQuery = `
      INSERT INTO salon_docente (salon_id, docente_id)
      VALUES ($1, $2)
      ON CONFLICT (salon_id, docente_id) DO NOTHING
      RETURNING salon_id, docente_id
    `;
    const inserted = await db.query(insertQuery, [salonIdNum, docenteIdNum]);

    if (inserted.rows.length === 0) {
      return res.json({ mensaje: 'El docente ya se encontraba asignado a este salón', yaAsignado: true });
    }

    res.json({ mensaje: 'Docente asignado al salón correctamente', asignacion: inserted.rows[0] });
  } catch (error) {
    console.error('Error al asignar docente:', error);
    res.status(500).json({ mensaje: 'Error al asignar docente al salón' });
  }
});

// 1.3 Matricular Estudiante en un Salón (DIRECTIVO y ADMINISTRATIVO)
router.post('/matricular', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  const estudianteIdNum = parseInt(req.body.estudianteId, 10);
  const salonIdNum = parseInt(req.body.salonId, 10);

  if (Number.isNaN(estudianteIdNum) || Number.isNaN(salonIdNum)) {
    return res.status(400).json({ mensaje: 'Debe especificar un estudiante y un salón válidos' });
  }

  try {
    const query = `
      INSERT INTO matriculas (estudiante_id, salon_id)
      VALUES ($1, $2)
      RETURNING id, estudiante_id, salon_id
    `;
    const result = await db.query(query, [estudianteIdNum, salonIdNum]);
    res.status(201).json({ mensaje: 'Estudiante matriculado exitosamente', matricula: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ mensaje: 'El estudiante ya se encuentra matriculado en este salón' });
    }
    console.error('Error al matricular estudiante:', error);
    res.status(500).json({ mensaje: 'Error interno al realizar la matrícula' });
  }
});

// ==================== 2. RUTAS GENERALES ====================

// 2.1 Crear un Salón (DIRECTIVO y ADMINISTRATIVO)
router.post('/', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  const { grado, seccion, anioEscolar } = req.body;
  const anioNum = parseInt(anioEscolar, 10);

  if (!grado || !seccion || Number.isNaN(anioNum)) {
    return res.status(400).json({ mensaje: 'Todos los campos (grado, sección, año escolar) son obligatorios' });
  }

  try {
    const query = `
      INSERT INTO salones (grado, seccion, anio_escolar)
      VALUES ($1, $2, $3)
      RETURNING id, grado, seccion, anio_escolar
    `;
    const result = await db.query(query, [String(grado).trim(), String(seccion).trim(), anioNum]);
    res.status(201).json({ mensaje: 'Salón creado exitosamente', salon: result.rows[0] });
  } catch (error) {
    console.error('Error al crear salón:', error);
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
        COUNT(DISTINCT m.estudiante_id)::int AS total_estudiantes,
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
      params.push(parseInt(anio, 10));
    }

    query += `
      GROUP BY s.id
      ORDER BY s.anio_escolar DESC, s.grado ASC, s.seccion ASC
    `;
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar salones:', error);
    res.status(500).json({ mensaje: 'Error al obtener la lista de salones' });
  }
});

module.exports = router;