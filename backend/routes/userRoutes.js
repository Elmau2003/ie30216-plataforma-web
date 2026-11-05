// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

// Todas las rutas de este archivo requieren estar autenticado y ser DIRECTIVO
router.use(verificarToken);
router.use(permitirRoles('DIRECTIVO'));

// 1. Obtener lista de todos los usuarios
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.dni, u.nombres, u.apellidos, u.correo, u.activo, u.fecha_creacion, r.nombre AS rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener la lista de usuarios' });
  }
});

// 2. Registrar un nuevo usuario (Docente, Administrativo, Estudiante o Directivo)
router.post('/', async (req, res) => {
  const { dni, nombres, apellidos, correo, password, rolNombre } = req.body;

  if (!dni || !nombres || !apellidos || !password || !rolNombre) {
    return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser completados' });
  }

  try {
    // Verificar si el DNI ya está registrado
    const existeDni = await db.query('SELECT id FROM usuarios WHERE dni = $1', [dni]);
    if (existeDni.rows.length > 0) {
      return res.status(400).json({ mensaje: 'El DNI ya se encuentra registrado en el sistema' });
    }

    // Obtener el ID del rol seleccionado
    const rolResult = await db.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);
    if (rolResult.rows.length === 0) {
      return res.status(400).json({ mensaje: 'El rol especificado no existe' });
    }
    const rolId = rolResult.rows[0].id;

    // Encriptar la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar usuario
    const insertQuery = `
      INSERT INTO usuarios (rol_id, dni, nombres, apellidos, correo, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, dni, nombres, apellidos, correo, activo
    `;
    const nuevoUsuario = await db.query(insertQuery, [
      rolId,
      dni,
      nombres,
      apellidos,
      correo || null,
      passwordHash,
    ]);

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: { ...nuevoUsuario.rows[0], rol: rolNombre },
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ mensaje: 'Error interno al registrar usuario' });
  }
});

// 3. Activar / Desactivar usuario
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body; // true o false

  if (typeof activo !== 'boolean') {
    return res.status(400).json({ mensaje: 'El valor de estado debe ser booleano (true/false)' });
  }

  try {
    const result = await db.query(
      'UPDATE usuarios SET activo = $1 WHERE id = $2 RETURNING id, dni, nombres, apellidos, activo',
      [activo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ mensaje: 'Error interno al actualizar estado del usuario' });
  }
});

module.exports = router;