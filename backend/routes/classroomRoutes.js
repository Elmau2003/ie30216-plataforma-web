// backend/routes/classroomRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// 1. Crear un Salón (Solo DIRECTIVO y ADMINISTRATIVO)
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
    const result = await db.query(query, [grado, seccion, anioEscolar]);
    res.status(201).json({ mensaje: 'Salón creado exitosamente', salon: result.rows[0] });
  } catch (error) {
    console.error('Error al crear salón:', error);
    res.status(500).json({ mensaje: 'Error al registrar el salón' });
  }
});

// 2. Listar Salones
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT s.id, s.grado, s.seccion, s.anio_escolar,
             COUNT(m.estudiante_id) AS total_estudiantes
      FROM salones s
      LEFT JOIN matriculas m ON s.id = m.salon_id
      GROUP BY s.id
      ORDER BY s.anio_escolar DESC, s.grado ASC, s.seccion ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar salones:', error);
    res.status(500).json({ mensaje: 'Error al obtener la lista de salones' });
  }
});

// 3. Asignar Docente a un Salón (Solo DIRECTIVO y ADMINISTRATIVO)
router.post('/asignar-docente', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  const { salonId, docenteId } = req.body;

  if (!salonId || !docenteId) {
    return res.status(400).json({ mensaje: 'Debe especificar el salón y el docente' });
  }

  try {
    // Validar que el usuario sea realmente un DOCENTE
    const docQuery = `
      SELECT u.id FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1 AND r.nombre = 'DOCENTE'
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
    console.error('Error al asignar docente:', error);
    res.status(500).json({ mensaje: 'Error al asignar docente al salón' });
  }
});

// 4. Matricular Estudiante en un Salón (Solo DIRECTIVO y ADMINISTRATIVO)
router.post('/matricular', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  const { estudianteId, salonId } = req.body;

  if (!estudianteId || !salonId) {
    return res.status(400).json({ mensaje: 'Debe especificar el estudiante y el salón' });
  }

  try {
    // Validar que el usuario a matricular sea un ESTUDIANTE
    const estQuery = `
      SELECT u.id FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1 AND r.nombre = 'ESTUDIANTE'
    `;
    const estCheck = await db.query(estQuery, [estudianteId]);
    if (estCheck.rows.length === 0) {
      return res.status(400).json({ mensaje: 'El usuario seleccionado no es un ESTUDIANTE' });
    }

    const query = `
      INSERT INTO matriculas (estudiante_id, salon_id)
      VALUES ($1, $2)
      RETURNING id, estudiante_id, salon_id
    `;
    const result = await db.query(query, [estudianteId, salonId]);

    res.status(201).json({ mensaje: 'Estudiante matriculado exitosamente', matricula: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Violación de unicidad en Postgres
      return res.status(400).json({ mensaje: 'El estudiante ya se encuentra matriculado en este salón' });
    }
    console.error('Error al matricular estudiante:', error);
    res.status(500).json({ mensaje: 'Error interno al realizar la matrícula' });
  }
});

module.exports = router;