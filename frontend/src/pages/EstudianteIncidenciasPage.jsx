// frontend/src/pages/EstudianteIncidenciasPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function EstudianteIncidenciasPage() {
  const [incidencias, setIncidencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargarIncidencias = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await fetchAPI('/incidents/estudiante/mis-incidencias');
      setIncidencias(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al obtener su historial de incidencias');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarIncidencias();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Mi Historial de Incidencias</h2>
        <p className="text-xs text-slate-500">Registro de observaciones conductuales y de convivencia emitidas por sus docentes</p>
      </div>

      {error && (
        <div className="p-4 border-l-4 border-red-500 bg-red-50 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {cargando ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-xl border border-slate-200">
            Cargando incidencias...
          </div>
        ) : incidencias.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-600 rounded-xl border border-slate-200 font-medium">
            ¡Felicitaciones! No registra incidencias ni observaciones en su expediente conductual.
          </div>
        ) : (
          incidencias.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {item.tipo}
                </span>
                <span className="text-xs font-mono text-slate-400">{item.fecha}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line">{item.descripcion}</p>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                Docente Reportante: <strong className="text-slate-800">{item.docente_nombre}</strong>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}