// frontend/src/pages/AdminMesaPartesPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function AdminMesaPartesPage() {
  const [expedientes, setExpedientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Campos del documento externo
  const [tipoRemitente, setTipoRemitente] = useState('PERSONA_NATURAL');
  const [remitenteNombre, setRemitenteNombre] = useState('');
  const [remitenteDocumento, setRemitenteDocumento] = useState('');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState(null);

  const cargarExpedientes = async () => {
    try {
      setCargando(true);
      const data = await fetchAPI('/communications/solicitudes/externas');
      setExpedientes(Array.isArray(data) ? data : []);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar trámites externos' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarExpedientes();
  }, []);

  const handleRegistrarTramite = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setEnviando(true);

    try {
      const formData = new FormData();
      formData.append('tipoRemitente', tipoRemitente);
      formData.append('remitenteNombre', remitenteNombre);
      formData.append('remitenteDocumento', remitenteDocumento);
      formData.append('asunto', asunto);
      formData.append('descripcion', descripcion);
      if (archivo) {
        formData.append('archivo', archivo);
      }

      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const resp = await fetch(`${baseUrl}/communications/solicitudes/externas`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.mensaje || 'No se pudo registrar el documento externo');
      }

      setMensaje({ tipo: 'exito', texto: data.mensaje || 'Documento externo registrado correctamente.' });
      setRemitenteNombre('');
      setRemitenteDocumento('');
      setAsunto('');
      setDescripcion('');
      setArchivo(null);
      cargarExpedientes();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  const etiquetaTipo = (tipo) => {
    if (tipo === 'PERSONA_JURIDICA') return 'Persona Jurídica';
    if (tipo === 'ENTIDAD') return 'Entidad';
    return 'Persona Natural';
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-slate-800">Mesa de Partes — Documentos Externos</h2>
        <p className="text-xs text-slate-500">
          Registro y seguimiento de solicitudes o documentos presentados por personas naturales, empresas o entidades
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

      {/* Formulario de Registro Externo */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
        <h3 className="text-md font-semibold text-slate-700 mb-4">Ingresar Solicitud o Documento Externo</h3>
        <form onSubmit={handleRegistrarTramite} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Remitente</label>
            <select
              value={tipoRemitente}
              onChange={(e) => setTipoRemitente(e.target.value)}
              className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="PERSONA_NATURAL">Persona Natural</option>
              <option value="PERSONA_JURIDICA">Persona Jurídica</option>
              <option value="ENTIDAD">Entidad</option>
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {tipoRemitente === 'PERSONA_NATURAL' ? 'Nombres y Apellidos' : 'Razón Social / Nombre de Entidad'}
            </label>
            <input
              type="text"
              value={remitenteNombre}
              onChange={(e) => setRemitenteNombre(e.target.value)}
              placeholder={
                tipoRemitente === 'PERSONA_NATURAL'
                  ? 'Ej. Juana Quispe Torres'
                  : 'Ej. UGEL Huancayo / Constructora Andes SAC'
              }
              required
              className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {tipoRemitente === 'PERSONA_NATURAL' ? 'DNI (Opcional)' : 'RUC / Código (Opcional)'}
            </label>
            <input
              type="text"
              maxLength={20}
              value={remitenteDocumento}
              onChange={(e) => setRemitenteDocumento(e.target.value)}
              placeholder={tipoRemitente === 'PERSONA_NATURAL' ? 'Ej. 45123698' : 'Ej. 20601234567'}
              className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            />
          </div>

          <div className="md:col-span-2 min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">Asunto del Documento</label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej. Solicitud de información institucional / Oficio recibido"
              required
              className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">Adjunto (PDF o Imagen)</label>
            <input
              type="file"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="w-full min-w-0 text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="md:col-span-3 min-w-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">Descripción / Sumilla</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle el contenido del documento o solicitud recibida..."
              required
              className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={enviando}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm shadow disabled:opacity-50 cursor-pointer"
            >
              {enviando ? 'Registrando...' : 'Registrar Trámite Externo'}
            </button>
          </div>
        </form>
      </div>

      {/* Seguimiento de Expedientes Externos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm">
          Expedientes Externos Registrados
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[740px]">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 whitespace-nowrap">Expediente</th>
                <th className="p-3 whitespace-nowrap">Remitente</th>
                <th className="p-3 whitespace-nowrap">Asunto</th>
                <th className="p-3 whitespace-nowrap">Adjunto</th>
                <th className="p-3 whitespace-nowrap">Fecha</th>
                <th className="p-3 whitespace-nowrap">Estado / Proveído</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    Cargando expedientes...
                  </td>
                </tr>
              ) : expedientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    Aún no se han registrado documentos externos.
                  </td>
                </tr>
              ) : (
                expedientes.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs font-bold text-blue-800 whitespace-nowrap">
                      {exp.numero_expediente}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{exp.remitente_nombre}</div>
                      <div className="text-xs text-slate-400">
                        {etiquetaTipo(exp.tipo_remitente)}
                        {exp.remitente_documento ? ` · ${exp.remitente_documento}` : ''}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{exp.asunto}</div>
                      <div className="text-xs text-slate-500 max-w-xs truncate">{exp.descripcion}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {exp.archivo_url ? (
                        <a
                          href={exp.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold whitespace-nowrap"
                        >
                          📎 Ver Archivo
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin adjunto</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-400 whitespace-nowrap">{exp.fecha}</td>
                    <td className="p-3 space-y-1 min-w-[160px]">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold text-white whitespace-nowrap ${
                          exp.estado === 'PENDIENTE'
                            ? 'bg-amber-500'
                            : exp.estado === 'ATENDIDO'
                            ? 'bg-emerald-600'
                            : 'bg-red-600'
                        }`}
                      >
                        {exp.estado}
                      </span>
                      {exp.respuesta_directivo && (
                        <p className="text-xs text-slate-500">{exp.respuesta_directivo}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}