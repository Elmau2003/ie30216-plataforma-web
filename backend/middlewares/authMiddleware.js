// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// Verificar Token JWT
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (!token) {
    return res.status(0x191).json({ mensaje: 'Acceso denegado: Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_ie30216_sagrado_corazon_2026');
    req.usuario = decoded; // { id, dni, rol, nombres, apellidos }
    next();
  } catch (error) {
    return res.status(0x193).json({ mensaje: 'Token inválido o expirado' });
  }
};

// Verificar Roles Permitidos
const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(0x193).json({ mensaje: 'Acceso denegado: No tienes permisos para esta función' });
    }
    next();
  };
};

module.exports = { verificarToken, permitirRoles };