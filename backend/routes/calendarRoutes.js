// backend/routes/calendarRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// GET /api/calendario?mes=11&anio=2026 (DIRECTIVO, ADMINISTRATIVO y DOCENTE)
router.get('/', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO', 'DOCENTE'), async (req, res) => {
  try {
    const { mes, anio } = req.query;
    let query = `
      SELECT 
        e.id,
        e.titulo,
        e.descripcion,
        e.tipo,
        TO_CHAR(e.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
        TO_CHAR(e.fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
        TO_CHAR(e.hora_inicio, 'HH24:MI') AS hora_inicio,
        TO_CHAR(e.hora_fin, 'HH24:MI') AS hora_fin,
        e.lugar,
        u.nombres || ' ' || u.apellidos AS creador_nombre
      FROM eventos_academicos e
      LEFT JOIN usuarios u ON e.creado_por = u.id
    `;
    const params = [];

    if (mes && anio) {
      const m = String(mes).padStart(2, '0');
      const primerDia = `${anio}-${m}-01`;
      query += `
        WHERE e.fecha_fin >= $1::date
          AND e.fecha_inicio < ($1::date + INTERVAL '1 month')
      `;
      params.push(primerDia);
    }

    query += ` ORDER BY e.fecha_inicio ASC, e.hora_inicio ASC NULLS LAST`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener eventos académicos:', error.message);
    res.status(500).json({ mensaje: 'Error al cargar el calendario académico' });
  }
});

// POST /api/calendario (DIRECTIVO y ADMINISTRATIVO)
router.post('/', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      tipo = 'INSTITUCIONAL',
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      lugar,
    } = req.body;

    if (!titulo || !fecha_inicio) {
      return res.status(400).json({ mensaje: 'El título y la fecha de inicio son obligatorios.' });
    }

    const fin = fecha_fin || fecha_inicio;
    if (fin < fecha_inicio) {
      return res.status(400).json({ mensaje: 'La fecha de fin no puede ser anterior a la de inicio.' });
    }

    const result = await db.query(
      `INSERT INTO eventos_academicos 
        (titulo, descripcion, tipo, fecha_inicio, fecha_fin, hora_inicio, hora_fin, lugar, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING 
        id, titulo, descripcion, tipo,
        TO_CHAR(fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
        TO_CHAR(fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
        TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
        TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin,
        lugar`,
      [
        titulo.trim(),
        descripcion?.trim() || null,
        tipo,
        fecha_inicio,
        fin,
        hora_inicio || null,
        hora_fin || null,
        lugar?.trim() || null,
        req.usuario.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear evento académico:', error.message);
    res.status(500).json({ mensaje: 'No se pudo programar el evento' });
  }
});

// PUT /api/calendario/:id (DIRECTIVO y ADMINISTRATIVO)
router.put('/:id', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      lugar,
    } = req.body;

    if (!titulo || !fecha_inicio) {
      return res.status(400).json({ mensaje: 'El título y la fecha de inicio son obligatorios.' });
    }

    const fin = fecha_fin || fecha_inicio;
    if (fin < fecha_inicio) {
      return res.status(400).json({ mensaje: 'La fecha de fin no puede ser anterior a la de inicio.' });
    }

    const result = await db.query(
      `UPDATE eventos_academicos
       SET titulo = $1,
           descripcion = $2,
           tipo = $3,
           fecha_inicio = $4,
           fecha_fin = $5,
           hora_inicio = $6,
           hora_fin = $7,
           lugar = $8
       WHERE id = $9
       RETURNING id`,
      [
        titulo.trim(),
        descripcion?.trim() || null,
        tipo || 'INSTITUCIONAL',
        fecha_inicio,
        fin,
        hora_inicio || null,
        hora_fin || null,
        lugar?.trim() || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }

    res.json({ mensaje: 'Evento actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar evento:', error.message);
    res.status(500).json({ mensaje: 'No se pudo actualizar el evento' });
  }
});

// DELETE /api/calendario/:id (DIRECTIVO y ADMINISTRATIVO)
router.delete('/:id', permitirRoles('DIRECTIVO', 'ADMINISTRATIVO'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM eventos_academicos WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }

    res.json({ mensaje: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar evento:', error.message);
    res.status(500).json({ mensaje: 'No se pudo eliminar el evento' });
  }
});

module.exports = router;