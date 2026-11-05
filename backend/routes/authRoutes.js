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
    // Buscar usuario y obtener el nombre de su rol
    const query = `
      SELECT u.id, u.dni, u.nombres, u.apellidos, u.password_hash, u.activo, r.nombre AS rol
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

    // Validar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    // Generar Token JWT (válido por 8 horas)
    const payload = {
      id: usuario.id,
      dni: usuario.dni,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      rol: usuario.rol,
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
      },
    });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Endpoint: Obtener perfil del usuario autenticado
router.get('/me', verificarToken, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;