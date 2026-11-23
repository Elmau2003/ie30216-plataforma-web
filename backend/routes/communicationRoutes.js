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

// ==================== SOLICITUDES INTERNAS (Docente -> Directivo) ====================

// 4. Enviar nueva solicitud con adjunto opcional (DOCENTE)
router.post('/solicitudes', permitirRoles('DOCENTE'), upload.single('archivo'), async (req, res) => {
  const { asunto, descripcion } = req.body;
  const docenteId = req.usuario.id;

  if (!asunto || !descripcion) {
    return res.status(400).json({ mensaje: 'Asunto y descripción son requeridos' });
  }

  let archivoUrl = null;

  try {
    if (req.file) {
      archivoUrl = await subirArchivoSupabase(req.file, 'solicitudes');
    }

    const query = `
      INSERT INTO solicitudes (docente_id, origen, asunto, descripcion, archivo_url)
      VALUES ($1, 'INTERNO', $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [docenteId, asunto, descripcion, archivoUrl]);
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

// 6. Listar todas las solicitudes internas y documentos externos recibidos (DIRECTIVO)
router.get('/solicitudes/todas', permitirRoles('DIRECTIVO'), async (req, res) => {
  try {
    const query = `
      SELECT s.id,
             COALESCE(s.origen, 'INTERNO') AS origen,
             s.numero_expediente,
             s.tipo_remitente,
             s.remitente_nombre,
             s.remitente_documento,
             s.asunto,
             s.descripcion,
             s.estado,
             s.respuesta_directivo,
             s.archivo_url,
             TO_CHAR(s.fecha_envio, 'DD/MM/YYYY HH24:MI') AS fecha,
             COALESCE(CONCAT(u.nombres, ' ', u.apellidos), s.remitente_nombre, 'Remitente Externo') AS docente,
             COALESCE(u.dni, s.remitente_documento, '-') AS docente_dni
      FROM solicitudes s
      LEFT JOIN usuarios u ON s.docente_id = u.id
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
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }
    res.json({ mensaje: 'Solicitud actualizada correctamente', solicitud: result.rows[0] });
  } catch (error) {
    console.error('Error al responder solicitud:', error);
    res.status(500).json({ mensaje: 'Error interno al procesar la solicitud' });
  }
});

// ==================== MESA DE PARTES / DOCUMENTOS EXTERNOS (ADMINISTRATIVO) ====================

// 7.1 Registrar documento / solicitud externa (ADMINISTRATIVO)
router.post('/solicitudes/externas', permitirRoles('ADMINISTRATIVO'), upload.single('archivo'), async (req, res) => {
  const { tipoRemitente, remitenteNombre, remitenteDocumento, asunto, descripcion } = req.body;
  const adminId = req.usuario.id;

  if (!tipoRemitente || !remitenteNombre || !asunto || !descripcion) {
    return res.status(400).json({
      mensaje: 'Tipo de remitente, nombre/razón social, asunto y descripción son requeridos',
    });
  }

  let archivoUrl = null;

  try {
    if (req.file) {
      archivoUrl = await subirArchivoSupabase(req.file, 'mesa-partes');
    }

    const anio = new Date().getFullYear();
    const countRes = await db.query(
      `SELECT COUNT(*)::int AS total FROM solicitudes WHERE origen = 'EXTERNO' AND EXTRACT(YEAR FROM fecha_envio) = $1`,
      [anio]
    );
    const correlativo = String((countRes.rows[0]?.total || 0) + 1).padStart(4, '0');
    const numeroExpediente = `EXP-${anio}-${correlativo}`;

    const query = `
      INSERT INTO solicitudes (
        docente_id,
        registrado_por_id,
        origen,
        numero_expediente,
        tipo_remitente,
        remitente_nombre,
        remitente_documento,
        asunto,
        descripcion,
        archivo_url
      )
      VALUES ($1, $2, 'EXTERNO', $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      null,
      adminId,
      numeroExpediente,
      tipoRemitente,
      String(remitenteNombre).trim(),
      remitenteDocumento ? String(remitenteDocumento).trim() : null,
      String(asunto).trim(),
      String(descripcion).trim(),
      archivoUrl,
    ]);

    return res.status(201).json({
      mensaje: `Documento externo registrado con expediente ${numeroExpediente}`,
      solicitud: result.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar solicitud externa:', error);
    return res.status(500).json({ mensaje: 'Error interno al registrar el documento externo' });
  }
});

// 7.2 Listar solicitudes / documentos externos (ADMINISTRATIVO / DIRECTIVO)
router.get('/solicitudes/externas', permitirRoles('ADMINISTRATIVO', 'DIRECTIVO'), async (req, res) => {
  try {
    const query = `
      SELECT s.id,
             COALESCE(s.numero_expediente, CONCAT('SOL-', s.id)) AS numero_expediente,
             s.origen,
             s.tipo_remitente,
             s.remitente_nombre,
             s.remitente_documento,
             s.asunto,
             s.descripcion,
             s.estado,
             s.respuesta_directivo,
             s.archivo_url,
             TO_CHAR(s.fecha_envio, 'DD/MM/YYYY HH24:MI') AS fecha,
             CONCAT(u.nombres, ' ', u.apellidos) AS registrado_por
      FROM solicitudes s
      LEFT JOIN usuarios u ON s.registrado_por_id = u.id
      WHERE s.origen = 'EXTERNO'
      ORDER BY s.fecha_envio DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar trámites externos:', error);
    res.status(500).json({ mensaje: 'Error al consultar trámites externos' });
  }
});

// ==================== CONSULTAS GENERALES (ADMINISTRATIVO) ====================

// 7.3 Consulta resumida de estudiantes y su matrícula/salón (sin detalle académico o conductual)
router.get('/consultas/estudiantes', permitirRoles('ADMINISTRATIVO', 'DIRECTIVO'), async (req, res) => {
  const anio = req.query.anio || new Date().getFullYear();
  const buscar = (req.query.q || '').trim().toLowerCase();

  try {
    const query = `
      SELECT u.id,
             u.dni,
             u.nombres,
             u.apellidos,
             u.activo,
             s.anio_escolar,
             s.grado,
             s.seccion
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN matriculas m ON m.estudiante_id = u.id
      LEFT JOIN salones s ON s.id = m.salon_id AND s.anio_escolar = $1
      WHERE r.nombre = 'ESTUDIANTE'
      ORDER BY u.apellidos ASC, u.nombres ASC
    `;
    const result = await db.query(query, [parseInt(anio)]);

    const filtrados = buscar
      ? result.rows.filter((est) => {
          const nombreCompleto = `${est.nombres} ${est.apellidos}`.toLowerCase();
          const dni = String(est.dni || '').toLowerCase();
          return nombreCompleto.includes(buscar) || dni.includes(buscar);
        })
      : result.rows;

    res.json(filtrados);
  } catch (error) {
    console.error('Error en consulta de estudiantes para administrativo:', error);
    res.status(500).json({ mensaje: 'Error al consultar información de estudiantes' });
  }
});

// 7.4 Consulta resumida de salones por año lectivo
router.get('/consultas/salones', permitirRoles('ADMINISTRATIVO', 'DIRECTIVO'), async (req, res) => {
  const anio = req.query.anio || new Date().getFullYear();

  try {
    const query = `
      SELECT s.id,
             s.grado,
             s.seccion,
             s.anio_escolar,
             COUNT(DISTINCT m.estudiante_id)::int AS total_matriculados,
             COALESCE(
               STRING_AGG(DISTINCT CONCAT(u.nombres, ' ', u.apellidos), ', '),
               'Sin docente asignado'
             ) AS docentes_asignados
      FROM salones s
      LEFT JOIN matriculas m ON m.salon_id = s.id
      LEFT JOIN salon_docente sd ON sd.salon_id = s.id
      LEFT JOIN usuarios u ON u.id = sd.docente_id
      WHERE s.anio_escolar = $1
      GROUP BY s.id
      ORDER BY s.grado ASC, s.seccion ASC
    `;
    const result = await db.query(query, [parseInt(anio)]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en consulta de salones para administrativo:', error);
    res.status(500).json({ mensaje: 'Error al consultar resumen de salones' });
  }
});

// 8. Listar directivos activos destinatarios (rol_id = 1, excluyendo admin DNI '00000000')
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

// ==================== COMUNICADOS DOCENTE -> ESTUDIANTES ====================

// 9. Publicar comunicado de aula (DOCENTE)
router.post('/comunicados-aula', permitirRoles('DOCENTE'), upload.single('archivo'), async (req, res) => {
  const { salonId, asunto, contenido } = req.body;
  const docenteId = req.usuario.id;

  if (!asunto || !contenido) {
    return res.status(400).json({ mensaje: 'El asunto y el contenido son requeridos' });
  }

  let archivoUrl = null;

  try {
    if (req.file) {
      archivoUrl = await subirArchivoSupabase(req.file, 'comunicados-aula');
    }

    const sId = (salonId && salonId !== 'TODOS' && salonId !== 'null' && salonId !== '') 
      ? parseInt(salonId) 
      : null;

    const query = `
      INSERT INTO comunicados_aula (docente_id, salon_id, asunto, contenido, archivo_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [docenteId, sId, asunto, contenido, archivoUrl]);

    res.status(201).json({ mensaje: 'Comunicado publicado exitosamente', comunicado: result.rows[0] });
  } catch (error) {
    console.error('Error al publicar comunicado de aula:', error.message);
    res.status(500).json({ mensaje: 'Error interno al publicar el comunicado' });
  }
});

// 10. Listar avisos de aula publicados por el docente (DOCENTE)
router.get('/comunicados-aula/mis-publicaciones', permitirRoles('DOCENTE'), async (req, res) => {
  const docenteId = req.usuario.id;
  try {
    const query = `
      SELECT ca.id, ca.asunto, ca.contenido, ca.archivo_url,
             TO_CHAR(ca.fecha_envio, 'DD/MM/YYYY HH24:MI') AS fecha,
             COALESCE(CONCAT(s.grado, ' "', s.seccion, '"'), 'Todos mis salones') AS salon_nombre
      FROM comunicados_aula ca
      LEFT JOIN salones s ON ca.salon_id = s.id
      WHERE ca.docente_id = $1
      ORDER BY ca.fecha_envio DESC
    `;
    const result = await db.query(query, [docenteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar avisos del docente:', error.message);
    res.status(500).json({ mensaje: 'Error al consultar publicaciones de aula' });
  }
});

// 11. Listar salones para el desplegable (Solo id, grado, seccion)
router.get('/salones-disponibles', async (req, res) => {
  try {
    const query = `
      SELECT id, grado, seccion 
      FROM salones 
      ORDER BY grado ASC, seccion ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar salones disponibles:', error.message);
    res.status(500).json({ mensaje: 'Error al consultar lista de salones' });
  }
});

// 12. Ver comunicados del Salón del Estudiante - SOLO LECTURA (ESTUDIANTE)
router.get('/comunicados-aula/estudiante', permitirRoles('ESTUDIANTE'), async (req, res) => {
  const estudianteId = req.usuario.id;
  try {
    const query = `
      SELECT ca.id, ca.asunto, ca.contenido, ca.archivo_url,
             TO_CHAR(ca.fecha_envio, 'DD/MM/YYYY HH24:MI') AS fecha,
             CONCAT(u.nombres, ' ', u.apellidos) AS docente
      FROM comunicados_aula ca
      JOIN usuarios u ON ca.docente_id = u.id
      LEFT JOIN matriculas m ON m.salon_id = ca.salon_id OR ca.salon_id IS NULL
      WHERE m.estudiante_id = $1 OR ca.salon_id IS NULL
      GROUP BY ca.id, u.nombres, u.apellidos
      ORDER BY ca.fecha_envio DESC
    `;
    const result = await db.query(query, [estudianteId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar comunicados para el estudiante:', error.message);
    res.status(500).json({ mensaje: 'Error al obtener comunicados del salón' });
  }
});

module.exports = router;