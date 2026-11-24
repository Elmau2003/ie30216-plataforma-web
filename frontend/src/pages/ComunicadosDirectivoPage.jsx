// frontend/src/pages/ComunicadosDirectivoPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function ComunicadosDirectivoPage() {
  const [comunicados, setComunicados] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Estados del Formulario
  const [destinatarioTipo, setDestinatarioTipo] = useState('TODOS');
  const [destinatarioId, setDestinatarioId] = useState('');
  const [asunto, setAsunto] = useState('');
  const [contenido, setContenido] = useState('');
  const [archivo, setArchivo] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarDatos = async () => {
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const [resCom, resUsers] = await Promise.all([
        fetchAPI('/communications/comunicados/enviados').catch(() => []),
        fetchAPI('/users').catch(() => []),
      ]);

      const listaCom = Array.isArray(resCom) ? resCom : [];
      const listaUsers = Array.isArray(resUsers) ? resUsers : [];

      setComunicados(listaCom);
      setDocentes(listaUsers.filter((u) => u.rol === 'DOCENTE'));
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar información' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleEnviarComunicado = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    if (destinatarioTipo === 'INDIVIDUAL' && !destinatarioId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione un docente destinatario.' });
      setGuardando(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('destinatarioTipo', destinatarioTipo);
      if (destinatarioTipo === 'INDIVIDUAL') {
        formData.append('destinatarioId', destinatarioId);
      }
      formData.append('asunto', asunto);
      formData.append('contenido', contenido);
      if (archivo) {
        formData.append('archivo', archivo);
      }

      await fetchAPI('/communications/comunicados', {
        method: 'POST',
        body: formData,
      });

      setMensaje({ tipo: 'exito', texto: 'Comunicado emitido correctamente.' });
      setAsunto('');
      setContenido('');
      setArchivo(null);
      setModalAbierto(false);
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
          <h2 className="text-xl font-bold text-slate-800">Emisión de Comunicados</h2>
          <p className="text-xs text-slate-500">Publicaciones y anuncios directivos con adjuntos</p>
        </div>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
        >
          + Emitir Comunicado
        </button>
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

      {/* Historial de Comunicados */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 text-sm">
          Historial de Comunicados Enviados
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[540px]">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 whitespace-nowrap">Destinatario</th>
                <th className="p-3 whitespace-nowrap">Asunto</th>
                <th className="p-3 whitespace-nowrap">Adjunto</th>
                <th className="p-3 whitespace-nowrap">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    Cargando comunicados...
                  </td>
                </tr>
              ) : comunicados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    No hay comunicados registrados.
                  </td>
                </tr>
              ) : (
                comunicados.map((c, idx) => (
                  <tr key={c.id || idx} className="hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.destinatario_tipo === 'TODOS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {c.destinatario || c.destinatario_tipo || 'General'}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{c.asunto}</td>
                    <td className="p-3 whitespace-nowrap">
                      {c.archivo_url ? (
                        <a
                          href={c.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition whitespace-nowrap"
                        >
                          📎 Ver Documento
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin adjunto</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {c.fecha || c.fecha_envio}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Emisión de Comunicado */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-xl border border-slate-200 space-y-4 my-auto min-w-0">
            <h3 className="text-lg font-bold text-slate-800">Nuevo Comunicado Oficial</h3>
            <form onSubmit={handleEnviarComunicado} className="space-y-4">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Alcance</label>
                <select
                  value={destinatarioTipo}
                  onChange={(e) => setDestinatarioTipo(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="TODOS">Todos los Docentes</option>
                  <option value="INDIVIDUAL">Docente Específico</option>
                </select>
              </div>

              {destinatarioTipo === 'INDIVIDUAL' && (
                <div className="min-w-0">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Docente Destinatario</label>
                  <select
                    value={destinatarioId}
                    onChange={(e) => setDestinatarioId(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Seleccionar Docente --</option>
                    {docentes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.apellidos}, {d.nombres}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Asunto</label>
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  required
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Contenido del Mensaje</label>
                <textarea
                  rows={4}
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  required
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Documento Adjunto (Opcional - PDF, DOCX, PNG)
                </label>
                <input
                  type="file"
                  onChange={(e) => setArchivo(e.target.files[0])}
                  className="w-full min-w-0 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Subiendo y Enviando...' : 'Enviar Comunicado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}