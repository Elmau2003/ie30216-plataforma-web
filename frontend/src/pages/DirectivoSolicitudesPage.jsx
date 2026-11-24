// frontend/src/pages/DirectivoSolicitudesPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function DirectivoSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estado para responder solicitud
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [estadoRespuesta, setEstadoRespuesta] = useState('ATENDIDO');
  const [comentarioRespuesta, setComentarioRespuesta] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarSolicitudes = async () => {
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const data = await fetchAPI('/communications/solicitudes/todas');
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar las solicitudes' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const handleAtenderSolicitud = async (e) => {
    e.preventDefault();
    if (!solicitudSeleccionada) return;

    setGuardando(true);
    try {
      await fetchAPI(`/communications/solicitudes/${solicitudSeleccionada.id}/responder`, {
        method: 'PUT',
        body: JSON.stringify({
          estado: estadoRespuesta,
          respuestaDirectivo: comentarioRespuesta,
        }),
      });

      setMensaje({ tipo: 'exito', texto: 'Solicitud respondida correctamente.' });
      setSolicitudSeleccionada(null);
      setComentarioRespuesta('');
      cargarSolicitudes();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const formatearTipoRemitente = (tipo) => {
    if (tipo === 'PERSONA_JURIDICA') return 'Persona Jurídica';
    if (tipo === 'ENTIDAD') return 'Entidad';
    if (tipo === 'PERSONA_NATURAL') return 'Persona Natural';
    return null;
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-slate-800">Bandeja de Solicitudes y Documentos Recibidos</h2>
        <p className="text-xs text-slate-500">
          Gestión y atención de trámites internos (docentes) y documentos externos (mesa de partes)
        </p>
      </div>

      {mensaje.texto && (
        <div
          className={`p-4 border-l-4 text-sm rounded break-words ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
              : 'bg-red-50 border-red-500 text-red-700'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Tabla de Solicitudes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[780px]">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 whitespace-nowrap">Origen / Remitente</th>
                <th className="p-3 whitespace-nowrap">Asunto</th>
                <th className="p-3 whitespace-nowrap">Descripción</th>
                <th className="p-3 whitespace-nowrap">Adjunto</th>
                <th className="p-3 whitespace-nowrap">Fecha</th>
                <th className="p-3 whitespace-nowrap">Estado</th>
                <th className="p-3 text-right whitespace-nowrap">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400">
                    Cargando solicitudes...
                  </td>
                </tr>
              ) : solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400">
                    No hay solicitudes ni documentos registrados.
                  </td>
                </tr>
              ) : (
                solicitudes.map((s) => {
                  const esExterno = s.origen === 'EXTERNO';
                  const tipoEtiqueta = formatearTipoRemitente(s.tipo_remitente);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              esExterno
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {esExterno ? s.numero_expediente || 'EXTERNO' : 'INTERNO'}
                          </span>
                          {tipoEtiqueta && (
                            <span className="text-[11px] text-slate-500">· {tipoEtiqueta}</span>
                          )}
                        </div>
                        <div className="font-medium text-slate-800">{s.docente}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {esExterno ? `Doc: ${s.docente_dni}` : `DNI: ${s.docente_dni}`}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{s.asunto}</td>
                      <td className="p-3 max-w-xs truncate text-xs text-slate-500" title={s.descripcion}>
                        {s.descripcion}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {s.archivo_url ? (
                          <a
                            href={s.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold transition whitespace-nowrap"
                          >
                            📎 Ver Expediente
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin adjunto</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-xs text-slate-400 whitespace-nowrap">{s.fecha}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${
                            s.estado === 'PENDIENTE'
                              ? 'bg-amber-500'
                              : s.estado === 'ATENDIDO'
                              ? 'bg-emerald-600'
                              : 'bg-red-600'
                          }`}
                        >
                          {s.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSolicitudSeleccionada(s);
                            setEstadoRespuesta(s.estado === 'PENDIENTE' ? 'ATENDIDO' : s.estado);
                            setComentarioRespuesta(s.respuesta_directivo || '');
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition cursor-pointer"
                        >
                          {s.estado === 'PENDIENTE' ? 'Atender' : 'Ver / Editar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Responder Solicitud */}
      {solicitudSeleccionada && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-xl border border-slate-200 space-y-4 my-auto min-w-0">
            <h3 className="text-lg font-bold text-slate-800 break-words">
              {solicitudSeleccionada.origen === 'EXTERNO'
                ? `Atender Documento Externo (${solicitudSeleccionada.numero_expediente || 'EXTERNO'})`
                : 'Atender Solicitud Docente'}
            </h3>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1 break-words">
              <div>
                <strong className="text-slate-700">
                  {solicitudSeleccionada.origen === 'EXTERNO' ? 'Remitente:' : 'Docente:'}
                </strong>{' '}
                {solicitudSeleccionada.docente}
              </div>
              {solicitudSeleccionada.tipo_remitente && (
                <div>
                  <strong className="text-slate-700">Tipo:</strong>{' '}
                  {formatearTipoRemitente(solicitudSeleccionada.tipo_remitente)}
                </div>
              )}
              <div>
                <strong className="text-slate-700">Asunto:</strong> {solicitudSeleccionada.asunto}
              </div>
              <div className="pt-1 text-slate-600">
                <strong className="text-slate-700">Detalle:</strong> {solicitudSeleccionada.descripcion}
              </div>
            </div>

            <form onSubmit={handleAtenderSolicitud} className="space-y-4">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Dictamen / Respuesta</label>
                <select
                  value={estadoRespuesta}
                  onChange={(e) => setEstadoRespuesta(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="ATENDIDO">ATENDIDO (Aprobado)</option>
                  <option value="RECHAZADO">RECHAZADO</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Comentario o Proveído (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={comentarioRespuesta}
                  onChange={(e) => setComentarioRespuesta(e.target.value)}
                  placeholder="Ingrese observaciones o resolución sobre la solicitud..."
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSolicitudSeleccionada(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Respuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}