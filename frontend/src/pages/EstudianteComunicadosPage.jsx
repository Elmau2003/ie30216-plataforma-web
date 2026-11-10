// frontend/src/pages/EstudianteComunicadosPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function EstudianteComunicadosPage() {
  const [comunicados, setComunicados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargarComunicados = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await fetchAPI('/communications/comunicados-aula/estudiante');
      setComunicados(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al obtener los comunicados');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarComunicados();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Comunicados e Informes del Aula</h2>
        <p className="text-xs text-slate-500">Avisos oficiales, citaciones y reuniones publicadas por sus docentes</p>
      </div>

      {error && (
        <div className="p-4 border-l-4 border-red-500 bg-red-50 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {cargando ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
            Cargando comunicados del salón...
          </div>
        ) : comunicados.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
            No tienes comunicados o convocatorias publicadas hasta el momento.
          </div>
        ) : (
          comunicados.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800 text-base">{c.asunto}</h3>
                <span className="text-xs font-mono text-slate-400">{c.fecha}</span>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-line">{c.contenido}</p>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Docente: <strong className="text-slate-700">{c.docente}</strong></span>
                {c.archivo_url && (
                  <a
                    href={c.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md transition"
                  >
                    📎 Descargar Adjunto
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}