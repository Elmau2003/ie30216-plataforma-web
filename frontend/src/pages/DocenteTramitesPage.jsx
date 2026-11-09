// frontend/src/pages/DocenteTramitesPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function DocenteTramitesPage() {
  const [comunicados, setComunicados] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [pestana, setPestana] = useState('comunicados');

  // Formulario Solicitud
  const [modalAbierto, setModalAbierto] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarDatos = async () => {
    try {
      const [resCom, resSol] = await Promise.all([
        fetchAPI('/communications/comunicados/mis-comunicados').catch(() => []),
        fetchAPI('/communications/solicitudes/mis-solicitudes').catch(() => []),
      ]);
      setComunicados(Array.isArray(resCom) ? resCom : []);
      setSolicitudes(Array.isArray(resSol) ? resSol : []);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleEnviarSolicitud = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const formData = new FormData();
      formData.append('asunto', asunto);
      formData.append('descripcion', descripcion);
      if (archivo) {
        formData.append('archivo', archivo);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/communications/solicitudes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.mensaje || 'Error al registrar solicitud');

      setMensaje({ tipo: 'exito', texto: 'Solicitud enviada correctamente a Dirección.' });
      setAsunto('');
      setDescripcion('');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Comunicación y Trámites Institucionales</h2>
          <p className="text-xs text-slate-500">Revise comunicados oficiales o envíe solicitudes a Dirección</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition"
        >
          + Nueva Solicitud
        </button>
      </div>

      {mensaje.texto && (
        <div
          className={`p-4 border-l-4 text-sm rounded ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
              : 'bg-red-50 border-red-500 text-red-700'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Navegación por pestañas */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setPestana('comunicados')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            pestana === 'comunicados'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Comunicados Recibidos ({comunicados.length})
        </button>
        <button
          onClick={() => setPestana('solicitudes')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            pestana === 'solicitudes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Mis Solicitudes ({solicitudes.length})
        </button>
      </div>

      {/* Pestaña: Comunicados */}
      {pestana === 'comunicados' && (
        <div className="space-y-4">
          {comunicados.length === 0 ? (
            <div className="bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
              No hay comunicados recibidos.
            </div>
          ) : (
            comunicados.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 text-base">{c.asunto}</h3>
                  <span className="text-xs font-mono text-slate-400">{c.fecha}</span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line">{c.contenido}</p>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Emisor: {c.remitente}</span>
                  {c.archivo_url && (
                    <a
                      href={c.archivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md transition"
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

      {/* Pestaña: Solicitudes */}
      {pestana === 'solicitudes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Asunto</th>
                <th className="p-3">Adjunto</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Respuesta de Dirección</th>
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
                    <td className="p-3 font-medium text-slate-800">{s.asunto}</td>
                    <td className="p-3">
                      {s.archivo_url ? (
                        <a
                          href={s.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
                        >
                          📎 Documento
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin adjunto</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-400">{s.fecha}</td>
                    <td className="p-3">
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
                    <td className="p-3 text-xs text-slate-600">{s.respuesta_directivo || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear Solicitud */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Presentar Solicitud / Trámite</h3>
            <form onSubmit={handleEnviarSolicitud} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Asunto de la Solicitud</label>
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  required
                  placeholder="Ej: Permiso por Capacitación Pedagógica"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fundamento / Exposición de Motivos</label>
                <textarea
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  placeholder="Describa los detalles de su trámite..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Documento / Expediente Adjunto (Opcional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setArchivo(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
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