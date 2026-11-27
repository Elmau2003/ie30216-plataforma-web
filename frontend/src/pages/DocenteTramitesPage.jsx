// frontend/src/pages/DocenteTramitesPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function DocenteTramitesPage() {
  const [comunicadosDirectivo, setComunicadosDirectivo] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [comunicadosAula, setComunicadosAula] = useState([]);
  const [directivos, setDirectivos] = useState([]);
  const [salones, setSalones] = useState([]);
  const [pestana, setPestana] = useState('comunicados-directivo');

  // Formulario Solicitud a Directivo
  const [modalSolicitudAbierto, setModalSolicitudAbierto] = useState(false);
  const [directivoId, setDirectivoId] = useState('');
  const [asuntoSolicitud, setAsuntoSolicitud] = useState('');
  const [descripcionSolicitud, setDescripcionSolicitud] = useState('');
  const [archivoSolicitud, setArchivoSolicitud] = useState(null);

  // Formulario Comunicado a Estudiantes
  const [modalAulaAbierto, setModalAulaAbierto] = useState(false);
  const [salonId, setSalonId] = useState('TODOS');
  const [asuntoAula, setAsuntoAula] = useState('');
  const [contenidoAula, setContenidoAula] = useState('');
  const [archivoAula, setArchivoAula] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarDatos = async () => {
    try {
      const [resComDir, resSol, resComAula, resDirectivos, resSalones] = await Promise.all([
        fetchAPI('/communications/comunicados/mis-comunicados').catch(() => []),
        fetchAPI('/communications/solicitudes/mis-solicitudes').catch(() => []),
        fetchAPI('/communications/comunicados-aula/mis-publicaciones').catch(() => []),
        fetchAPI('/communications/directivos-activos').catch(() => []),
        fetchAPI('/communications/salones-disponibles').catch(() => []),
      ]);

      setComunicadosDirectivo(Array.isArray(resComDir) ? resComDir : []);
      setSolicitudes(Array.isArray(resSol) ? resSol : []);
      setComunicadosAula(Array.isArray(resComAula) ? resComAula : []);
      setDirectivos(Array.isArray(resDirectivos) ? resDirectivos : []);
      setSalones(Array.isArray(resSalones) ? resSalones : []);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Enviar Solicitud a Directivo
  const handleEnviarSolicitud = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    if (!directivoId) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un directivo destinatario.' });
      setGuardando(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('directivoId', directivoId);
      formData.append('asunto', asuntoSolicitud);
      formData.append('descripcion', descripcionSolicitud);
      if (archivoSolicitud) {
        formData.append('archivo', archivoSolicitud);
      }

      await fetchAPI('/communications/solicitudes', {
        method: 'POST',
        body: formData,
      });

      setMensaje({ tipo: 'exito', texto: 'Solicitud enviada correctamente a Dirección.' });
      setDirectivoId('');
      setAsuntoSolicitud('');
      setDescripcionSolicitud('');
      setArchivoSolicitud(null);
      setModalSolicitudAbierto(false);
      cargarDatos();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Enviar Comunicado a Estudiantes
  const handleEnviarComunicadoAula = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const formData = new FormData();
      formData.append('salonId', salonId);
      formData.append('asunto', asuntoAula);
      formData.append('contenido', contenidoAula);
      if (archivoAula) {
        formData.append('archivo', archivoAula);
      }

      await fetchAPI('/communications/comunicados-aula', {
        method: 'POST',
        body: formData,
      });

      setMensaje({ tipo: 'exito', texto: 'Comunicado publicado para los estudiantes correctamente.' });
      setSalonId('TODOS');
      setAsuntoAula('');
      setContenidoAula('');
      setArchivoAula(null);
      setModalAulaAbierto(false);
      cargarDatos();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-800">Módulo de Comunicaciones Docente</h2>
          <p className="text-xs text-slate-500">Gestione anuncios a estudiantes y trámites con la Dirección</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setModalAulaAbierto(true)}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            + Publicar Comunicado Aula
          </button>
          <button
            type="button"
            onClick={() => setModalSolicitudAbierto(true)}
            className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            + Nueva Solicitud
          </button>
        </div>
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

      {/* Navegación por pestañas */}
      <div className="flex border-b border-slate-200 gap-4 overflow-x-auto min-w-0">
        <button
          type="button"
          onClick={() => setPestana('comunicados-directivo')}
          className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer whitespace-nowrap shrink-0 ${
            pestana === 'comunicados-directivo'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Comunicados Dirección ({comunicadosDirectivo.length})
        </button>
        <button
          type="button"
          onClick={() => setPestana('comunicados-aula')}
          className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer whitespace-nowrap shrink-0 ${
            pestana === 'comunicados-aula'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Mis Avisos a Estudiantes ({comunicadosAula.length})
        </button>
        <button
          type="button"
          onClick={() => setPestana('solicitudes')}
          className={`pb-3 text-sm font-semibold border-b-2 transition cursor-pointer whitespace-nowrap shrink-0 ${
            pestana === 'solicitudes'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Mis Solicitudes enviadas ({solicitudes.length})
        </button>
      </div>

      {/* Pestaña: Comunicados Dirección */}
      {pestana === 'comunicados-directivo' && (
        <div className="space-y-4 min-w-0">
          {comunicadosDirectivo.length === 0 ? (
            <div className="bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
              No hay comunicados directivos recibidos.
            </div>
          ) : (
            comunicadosDirectivo.map((c) => (
              <div key={c.id} className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-1">
                  <h3 className="font-bold text-slate-800 text-base break-words">{c.asunto}</h3>
                  <span className="text-xs font-mono text-slate-400 whitespace-nowrap">{c.fecha}</span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line break-words">{c.contenido}</p>
                <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Emisor: {c.remitente}</span>
                  {c.archivo_url && (
                    <a
                      href={c.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md transition whitespace-nowrap"
                    >
                      📎 Descargar Adjunto
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pestaña: Avisos a Estudiantes */}
      {pestana === 'comunicados-aula' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[640px]">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 whitespace-nowrap">Destinatario / Salón</th>
                  <th className="p-3 whitespace-nowrap">Asunto</th>
                  <th className="p-3 whitespace-nowrap">Contenido</th>
                  <th className="p-3 whitespace-nowrap">Adjunto</th>
                  <th className="p-3 whitespace-nowrap">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comunicadosAula.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      No ha publicado avisos para estudiantes aún.
                    </td>
                  </tr>
                ) : (
                  comunicadosAula.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {c.salon_nombre || 'Todos mis salones'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{c.asunto}</td>
                      <td className="p-3 max-w-xs truncate text-xs text-slate-500" title={c.contenido}>
                        {c.contenido}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {c.archivo_url ? (
                          <a
                            href={c.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition whitespace-nowrap"
                          >
                            📎 Ver Adjunto
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin adjunto</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-xs text-slate-400 whitespace-nowrap">{c.fecha}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pestaña: Solicitudes */}
      {pestana === 'solicitudes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[640px]">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 whitespace-nowrap">Asunto</th>
                  <th className="p-3 whitespace-nowrap">Adjunto</th>
                  <th className="p-3 whitespace-nowrap">Fecha</th>
                  <th className="p-3 whitespace-nowrap">Estado</th>
                  <th className="p-3 whitespace-nowrap">Respuesta de Dirección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      No ha registrado solicitudes aún.
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800 whitespace-nowrap">{s.asunto}</td>
                      <td className="p-3 whitespace-nowrap">
                        {s.archivo_url ? (
                          <a
                            href={s.archivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition whitespace-nowrap"
                          >
                            📎 Documento
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
                      <td className="p-3 text-xs text-slate-600 min-w-[180px]">{s.respuesta_directivo || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Emitir Comunicado Aula */}
      {modalAulaAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-xl border border-slate-200 space-y-4 my-auto min-w-0">
            <h3 className="text-lg font-bold text-slate-800">Publicar Comunicado de Aula</h3>
            <form onSubmit={handleEnviarComunicadoAula} className="space-y-4">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Salón / Grado Destinatario</label>
                <select
                  value={salonId}
                  onChange={(e) => setSalonId(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white"
                >
                  <option value="TODOS">Todos mis Salones</option>
                  {salones.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.grado}° "{s.seccion}" - {s.nivel || 'Primaria'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Asunto / Título del Aviso</label>
                <input
                  type="text"
                  value={asuntoAula}
                  onChange={(e) => setAsuntoAula(e.target.value)}
                  required
                  placeholder="Ej: Convocatoria a Reunión de Apoderados"
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Contenido del Comunicado</label>
                <textarea
                  rows={4}
                  value={contenidoAula}
                  onChange={(e) => setContenidoAula(e.target.value)}
                  required
                  placeholder="Escriba los detalles de la reunión o aviso..."
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Documento Adjunto (Opcional - PDF, Imagen)
                </label>
                <input
                  type="file"
                  onChange={(e) => setArchivoAula(e.target.files[0])}
                  className="w-full min-w-0 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAulaAbierto(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Publicando...' : 'Publicar Comunicado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Solicitud */}
      {modalSolicitudAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-xl border border-slate-200 space-y-4 my-auto min-w-0">
            <h3 className="text-lg font-bold text-slate-800">Presentar Solicitud / Trámite</h3>
            <form onSubmit={handleEnviarSolicitud} className="space-y-4">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Directivo Destinatario</label>
                <select
                  value={directivoId}
                  onChange={(e) => setDirectivoId(e.target.value)}
                  required
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white"
                >
                  <option value="">-- Seleccionar Directivo Activo --</option>
                  {directivos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.apellidos}, {d.nombres}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Asunto de la Solicitud</label>
                <input
                  type="text"
                  value={asuntoSolicitud}
                  onChange={(e) => setAsuntoSolicitud(e.target.value)}
                  required
                  placeholder="Ej: Permiso por Capacitación Pedagógica"
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Fundamento / Exposición de Motivos</label>
                <textarea
                  rows={4}
                  value={descripcionSolicitud}
                  onChange={(e) => setDescripcionSolicitud(e.target.value)}
                  required
                  placeholder="Describa los detalles de su trámite..."
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Documento / Expediente Adjunto (Opcional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setArchivoSolicitud(e.target.files[0])}
                  className="w-full min-w-0 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalSolicitudAbierto(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Subiendo y Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}