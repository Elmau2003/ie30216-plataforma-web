// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verificarToken } = require('../middlewares/authMiddleware');

// Endpoint: LOGIN
router.post('/login', async (req, res) => {
  const { dni, password } = req.body;

  if (!dni || !password) {
    return res.status(400).json({ mensaje: 'Ingrese DNI y contraseña' });
  }

  try {
    const query = `
      SELECT u.id, u.dni, u.nombres, u.apellidos, u.password_hash, u.activo,
             COALESCE(u.debe_cambiar_password, FALSE) AS debe_cambiar_password,
             r.nombre AS rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.dni = $1
    `;
    const result = await db.query(query, [dni]);

    if (result.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const usuario = result.rows[0];

    if (!usuario.activo) {
      return res.status(403).json({ mensaje: 'El usuario se encuentra inactivo' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    const payload = {
      id: usuario.id,
      dni: usuario.dni,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      rol: usuario.rol,
      debe_cambiar_password: usuario.debe_cambiar_password,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'clave_secreta_ie30216_sagrado_corazon_2026',
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        dni: usuario.dni,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        rol: usuario.rol,
        debe_cambiar_password: usuario.debe_cambiar_password,
      },
    });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Endpoint: Cambio obligatorio de contraseña del usuario autenticado
router.post('/cambiar-password', verificarToken, async (req, res) => {
  const { passwordActual, nuevaPassword } = req.body;
  const usuarioId = req.usuario.id;

  if (!passwordActual || !nuevaPassword) {
    return res.status(400).json({ mensaje: 'Debe ingresar su contraseña actual y la nueva contraseña' });
  }

  if (String(nuevaPassword).trim().length < 6) {
    return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const result = await db.query(
      'SELECT id, password_hash FROM usuarios WHERE id = $1',
      [usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const passwordValido = await bcrypt.compare(String(passwordActual), result.rows[0].password_hash);
    if (!passwordValido) {
      return res.status(400).json({ mensaje: 'La contraseña actual / temporal es incorrecta' });
    }

    const nuevoHash = await bcrypt.hash(String(nuevaPassword).trim(), 10);

    await db.query(
      `UPDATE usuarios
       SET password_hash = $1, debe_cambiar_password = FALSE
       WHERE id = $2`,
      [nuevoHash, usuarioId]
    );

    res.json({
      mensaje: 'Contraseña actualizada correctamente',
      debe_cambiar_password: false,
    });
  } catch (error) {
    console.error('Error en /cambiar-password:', error);
    res.status(500).json({ mensaje: 'Error interno al actualizar la contraseña' });
  }
});

// Endpoint: Obtener perfil del usuario autenticado
router.get('/me', verificarToken, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;