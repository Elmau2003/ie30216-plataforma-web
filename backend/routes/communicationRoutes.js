// backend/routes/communicationRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const supabase = require('../services/supabase');
const upload = require('../middlewares/uploadMiddleware');
const { verificarToken, permitirRoles } = require('../middlewares/authMiddleware');

router.use(verificarToken);

/**
 * Función auxiliar para subir un buffer de archivo a Supabase Storage
 */
async function subirArchivoSupabase(file, carpeta) {
  const extension = file.originalname.split('.').pop();
  const fileName = `${carpeta}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('adjuntos-intranet')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error en Supabase Storage: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('adjuntos-intranet')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

// ==================== COMUNICADOS (Directivo -> Docentes) ====================

// 1. Crear y emitir comunicado con adjunto opcional (DIRECTIVO)
router.post('/comunicados', permitirRoles('DIRECTIVO'), upload.single('archivo'), async (req, res) => {
  const { destinatarioTipo, destinatarioId, asunto, contenido } = req.body;
  const remitenteId = req.usuario.id;

  if (!destinatarioTipo || !asunto || !contenido) {
    return res.status(400).json({ mensaje: 'Asunto, contenido y tipo de destinatario son requeridos' });
  }

  let archivoUrl = null;

  try {
    // Si se adjuntó un archivo en el formulario, se procesa la subida a Supabase
    if (req.file) {
      archivoUrl = await subirArchivoSupabase(req.file, 'comunicados');
    }

    const query = `
      INSERT INTO comunicados (remitente_id, destinatario_tipo, destinatario_id, asunto, contenido, archivo_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const destId = destinatarioTipo === 'TODOS' ? null : parseInt(destinatarioId);
    const result = await db.query(query, [remitenteId, destinatarioTipo, destId, asunto, contenido, archivoUrl]);

    res.status(201).json({ mensaje: 'Comunicado emitido correctamente', comunicado: result.rows[0] });
  } catch (error) {
    console.error('Error al emitir comunicado:', error);
    res.status(500).json({ mensaje: 'Error interno al enviar el comunicado' });
  }
});

// 2. Listar comunicados recibidos (DOCENTE)
router.get('/comunicados/mis-comunicados', permitirRoles('DOCENTE'), async (req, res) => {
  const docenteId = req.usuario.id;
  try {
    const query = `
      SELECT c.id, c.asunto, c.contenido, c.archivo_url,
             TO_CHAR(c.fecha_envio, 'DD/MM/YYYY HH24:MI') AS fecha,
             CONCAT(u.nombres, ' ', u.apellidos) AS remitente
      FROM comunicados c
      JOIN usuarios u ON c.remitente_id = u.id
      WHERE c.destinatario_tipo = 'TODOS' OR c.destinatario_id = $1
      ORDER BY c.fecha_envio DESC
    `;
    const result = await db.query(query, [docenteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener comunicados:', error);
    res.status(500).json({ mensaje: 'Error al consultar comunicados' });
  }
});

// 3. Listar historial de comunicados emitidos (DIRECTIVO)
router.get('/comunicados/enviados', permitirRoles('DIRECTIVO'), async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.asunto, c.contenido, c.destinatario_tipo, c.archivo_url,
             TO_CHAR(c.fecha_envio, 'DD/MM/YYYY HH24:MI') AS fecha,
             COALESCE(CONCAT(u.nombres, ' ', u.apellidos), 'Todos los Docentes') AS destinatario
      FROM comunicados c
      LEFT JOIN usuarios u ON c.destinatario_id = u.id
      ORDER BY c.fecha_envio DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar comunicados enviados:', error);
    res.status(500).json({ mensaje: 'Error al consultar historial de comunicados' });
  }
});

// ==================== SOLICITUDES (Docente -> Directivo) ====================

// 4. Enviar nueva solicitud con adjunto opcional (DOCENTE)
router.post('/solicitudes', permitirRoles('DOCENTE'), upload.single('archivo'), async (req, res) => {
  const { asunto, descripcion } = req.body;
  const docenteId = req.usuario.id;

  if (!asunto || !descripcion) {
    return res.status(400).json({ mensaje: 'Asunto y descripción son requeridos' });
  }

  let archivoUrl = null;

  try {
    // Solo sube a Supabase si req.file efectivamente existe
    if (req.file) {
      archivoUrl = await subirArchivoSupabase(req.file, 'solicitudes');
    }

    const query = `
      INSERT INTO solicitudes (docente_id, asunto, descripcion, archivo_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [docenteId, asunto, descripcion, archivoUrl]);
    
    // Garantizar respuesta JSON explícita
    return res.status(201).json({ mensaje: 'Solicitud enviada correctamente', solicitud: result.rows[0] });
  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    return res.status(500).json({ mensaje: 'Error interno al registrar la solicitud' });
  }
});

// 5. Mis solicitudes enviadas (DOCENTE)
router.get('/solicitudes/mis-solicitudes', permitirRoles('DOCENTE'), async (req, res) => {
  const docenteId = req.usuario.id;
  try {
    const query = `
      SELECT id, asunto, descripcion, estado, respuesta_directivo, archivo_url,
             TO_CHAR(fecha_envio, 'DD/MM/YYYY HH24:MI') AS fecha
      FROM solicitudes
      WHERE docente_id = $1
      ORDER BY fecha_envio DESC
    `;
    const result = await db.query(query, [docenteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar solicitudes del docente:', error);
    res.status(500).json({ mensaje: 'Error al consultar mis solicitudes' });
  }
});

// 6. Listar todas las solicitudes recibidas (DIRECTIVO)
router.get('/solicitudes/todas', permitirRoles('DIRECTIVO'), async (req, res) => {
  try {
    const query = `
      SELECT s.id, s.asunto, s.descripcion, s.estado, s.respuesta_directivo, s.archivo_url,
             TO_CHAR(s.fecha_envio, 'DD/MM/YYYY HH24:MI') AS fecha,
             CONCAT(u.nombres, ' ', u.apellidos) AS docente, u.dni
      FROM solicitudes s
      JOIN usuarios u ON s.docente_id = u.id
      ORDER BY s.fecha_envio DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar solicitudes para directivo:', error);
    res.status(500).json({ mensaje: 'Error al listar solicitudes' });
  }
});

// 7. Atender/Responder una solicitud (DIRECTIVO)
router.put('/solicitudes/:id/responder', permitirRoles('DIRECTIVO'), async (req, res) => {
  const { id } = req.params;
  const { estado, respuestaDirectivo } = req.body;

  if (!['ATENDIDO', 'RECHAZADO'].includes(estado)) {
    return res.status(400).json({ mensaje: 'Estado inválido' });
  }

  try {
    const query = `
      UPDATE solicitudes
      SET estado = $1, respuesta_directivo = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [estado, respuestaDirectivo || '', id]);
    res.json({ mensaje: 'Solicitud actualizada', solicitud: result.rows[0] });
  } catch (error) {
    console.error('Error al responder solicitud:', error);
    res.status(500).json({ mensaje: 'Error interno al procesar la solicitud' });
  }
});

// Listar directivos activos destinatarios (rol_id = 1, excluyendo al admin DNI '00000000')
router.get('/directivos-activos', async (req, res) => {
  try {
    const query = `
      SELECT id, nombres, apellidos, dni 
      FROM usuarios 
      WHERE rol_id = 1 
        AND dni != '00000000'
        AND activo = TRUE
      ORDER BY apellidos ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener directivos activos:', error);
    res.status(500).json({ mensaje: 'Error al obtener la lista de directivos' });
  }
});

// 6. Listar todas las solicitudes recibidas por Directivos (DIRECTIVO)
router.get('/solicitudes/todas', permitirRoles('DIRECTIVO'), async (req, res) => {
  try {
    const query = `
      SELECT s.id, s.asunto, s.descripcion, s.estado, s.respuesta_directivo, s.archivo_url,
             TO_CHAR(s.fecha_envio, 'DD/MM/YYYY HH24:MI') AS fecha,
             CONCAT(u.nombres, ' ', u.apellidos) AS docente, u.dni AS docente_dni
      FROM solicitudes s
      JOIN usuarios u ON s.docente_id = u.id
      ORDER BY s.fecha_envio DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar solicitudes para directivo:', error);
    res.status(500).json({ mensaje: 'Error al listar solicitudes' });
  }
});

// 7. Atender / Responder una solicitud (DIRECTIVO)
router.put('/solicitudes/:id/responder', permitirRoles('DIRECTIVO'), async (req, res) => {
  const { id } = req.params;
  const { estado, respuestaDirectivo } = req.body;

  if (!['ATENDIDO', 'RECHAZADO'].includes(estado)) {
    return res.status(400).json({ mensaje: 'Estado inválido' });
  }

  try {
    const query = `
      UPDATE solicitudes
      SET estado = $1, respuesta_directivo = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [estado, respuestaDirectivo || '', id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    res.json({ mensaje: 'Solicitud actualizada correctamente', solicitud: result.rows[0] });
  } catch (error) {
    console.error('Error al responder solicitud:', error);
    res.status(500).json({ mensaje: 'Error interno al procesar la solicitud' });
  }
}); 

module.exports = router;