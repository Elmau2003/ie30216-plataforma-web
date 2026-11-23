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

// 2. Registrar un nuevo usuario (siempre inicia con clave temporal -> debe_cambiar_password = TRUE)
router.post('/', async (req, res) => {
  const { dni, nombres, apellidos, correo, password, rolNombre } = req.body;

  if (!dni || !nombres || !apellidos || !password || !rolNombre) {
    return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser completados' });
  }

  try {
    const existeDni = await db.query('SELECT id FROM usuarios WHERE dni = $1', [dni]);
    if (existeDni.rows.length > 0) {
      return res.status(400).json({ mensaje: 'El DNI ya se encuentra registrado en el sistema' });
    }

    const rolResult = await db.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);
    if (rolResult.rows.length === 0) {
      return res.status(400).json({ mensaje: 'El rol especificado no existe' });
    }
    const rolId = rolResult.rows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO usuarios (rol_id, dni, nombres, apellidos, correo, password_hash, debe_cambiar_password)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING id, dni, nombres, apellidos, correo, activo, debe_cambiar_password
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

// 4. Editar datos de un usuario y/o resetear contraseña
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, correo, rolNombre, nuevaPassword, resetearAlDni } = req.body;

  if (!nombres || !apellidos || !rolNombre) {
    return res.status(400).json({ mensaje: 'Nombres, apellidos y rol son obligatorios' });
  }

  try {
    const userResult = await db.query('SELECT id, dni FROM usuarios WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    const usuarioActual = userResult.rows[0];

    const rolResult = await db.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);
    if (rolResult.rows.length === 0) {
      return res.status(400).json({ mensaje: 'El rol especificado no existe' });
    }
    const rolId = rolResult.rows[0].id;

    let claveAAsignar = null;
    if (resetearAlDni) {
      claveAAsignar = String(usuarioActual.dni).trim();
    } else if (nuevaPassword && String(nuevaPassword).trim().length > 0) {
      if (String(nuevaPassword).trim().length < 6) {
        return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      claveAAsignar = String(nuevaPassword).trim();
    }

    let query;
    let params;

    if (claveAAsignar) {
      const passwordHash = await bcrypt.hash(claveAAsignar, 10);
      query = `
        UPDATE usuarios
        SET nombres = $1,
            apellidos = $2,
            correo = $3,
            rol_id = $4,
            password_hash = $5,
            debe_cambiar_password = TRUE
        WHERE id = $6
        RETURNING id, dni, nombres, apellidos, correo, activo, debe_cambiar_password
      `;
      params = [nombres, apellidos, correo || null, rolId, passwordHash, id];
    } else {
      query = `
        UPDATE usuarios
        SET nombres = $1, apellidos = $2, correo = $3, rol_id = $4
        WHERE id = $5
        RETURNING id, dni, nombres, apellidos, correo, activo, debe_cambiar_password
      `;
      params = [nombres, apellidos, correo || null, rolId, id];
    }

    const result = await db.query(query, params);

    res.json({
      mensaje: claveAAsignar
        ? 'Usuario actualizado y contraseña restablecida (deberá cambiarla al ingresar)'
        : 'Usuario actualizado correctamente',
      usuario: { ...result.rows[0], rol: rolNombre },
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno al actualizar usuario' });
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

// 4. Editar datos de un usuario y/o resetear contraseña
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, correo, rolNombre, nuevaPassword, resetearAlDni } = req.body;

  if (!nombres || !apellidos || !rolNombre) {
    return res.status(400).json({ mensaje: 'Nombres, apellidos y rol son obligatorios' });
  }

  try {
    // Verificar que el usuario exista y obtener su DNI por si se resetea al DNI
    const userResult = await db.query('SELECT id, dni FROM usuarios WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    const usuarioActual = userResult.rows[0];

    // Obtener ID del rol
    const rolResult = await db.query('SELECT id FROM roles WHERE nombre = $1', [rolNombre]);
    if (rolResult.rows.length === 0) {
      return res.status(400).json({ mensaje: 'El rol especificado no existe' });
    }
    const rolId = rolResult.rows[0].id;

    let claveAAsignar = null;
    if (resetearAlDni) {
      claveAAsignar = String(usuarioActual.dni).trim();
    } else if (nuevaPassword && String(nuevaPassword).trim().length > 0) {
      if (String(nuevaPassword).trim().length < 6) {
        return res.status(400).json({ mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      claveAAsignar = String(nuevaPassword).trim();
    }

    let query;
    let params;

    if (claveAAsignar) {
      const passwordHash = await bcrypt.hash(claveAAsignar, 10);
      query = `
        UPDATE usuarios
        SET nombres = $1, apellidos = $2, correo = $3, rol_id = $4, password_hash = $5
        WHERE id = $6
        RETURNING id, dni, nombres, apellidos, correo, activo
      `;
      params = [nombres, apellidos, correo || null, rolId, passwordHash, id];
    } else {
      query = `
        UPDATE usuarios
        SET nombres = $1, apellidos = $2, correo = $3, rol_id = $4
        WHERE id = $5
        RETURNING id, dni, nombres, apellidos, correo, activo
      `;
      params = [nombres, apellidos, correo || null, rolId, id];
    }

    const result = await db.query(query, params);

    res.json({
      mensaje: claveAAsignar
        ? 'Usuario actualizado y contraseña restablecida correctamente'
        : 'Usuario actualizado correctamente',
      usuario: { ...result.rows[0], rol: rolNombre },
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno al actualizar usuario' });
  }
});

// 5. Eliminar usuario
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Evitar eliminar al propio usuario en sesión
  if (parseInt(id) === req.usuario.id) {
    return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta en sesión' });
  }

  try {
    const result = await db.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ mensaje: 'No se puede eliminar el usuario porque tiene registros asociados (asistencias, notas, salones)' });
  }
});

module.exports = router;