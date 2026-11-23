// frontend/src/pages/AdminConsultasPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function AdminConsultasPage() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [busqueda, setBusqueda] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [salones, setSalones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarConsultas = async () => {
    try {
      setCargando(true);
      setError('');
      const [resEst, resSal] = await Promise.all([
        fetchAPI(`/communications/consultas/estudiantes?anio=${anio}&q=${encodeURIComponent(busqueda)}`),
        fetchAPI(`/communications/consultas/salones?anio=${anio}`),
      ]);
      setEstudiantes(Array.isArray(resEst) ? resEst : []);
      setSalones(Array.isArray(resSal) ? resSal : []);
    } catch (err) {
      setError(err.message || 'Error al cargar consultas generales');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConsultas();
  }, [anio]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarConsultas();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Consultas Generales de Secretaría</h2>
          <p className="text-xs text-slate-500">
            Consulta resumida de matrícula, salones y datos básicos de estudiantes (sin detalle académico o conductual)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <label className="text-xs font-semibold text-slate-600">Año Lectivo:</label>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value) || new Date().getFullYear())}
            className="w-20 text-xs font-bold text-blue-700 bg-transparent border-0 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Resumen General de Salones */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-md font-semibold text-slate-700">Resumen de Salones ({anio})</h3>
        {cargando ? (
          <p className="text-sm text-slate-400">Cargando salones...</p>
        ) : salones.length === 0 ? (
          <p className="text-sm text-slate-400">No hay salones registrados para el año {anio}.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salones.map((salon) => (
              <div key={salon.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-sm">
                    {salon.grado} "{salon.seccion}"
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {salon.total_matriculados} matriculados
                  </span>
                </div>
                <p className="text-xs text-slate-500">Docente(s): {salon.docentes_asignados}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consulta de Estudiantes */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
          <h3 className="text-md font-semibold text-slate-700">Directorio Resumido de Estudiantes</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por DNI o apellidos/nombres..."
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-64"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Buscar
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">DNI</th>
                <th className="p-3">Apellidos y Nombres</th>
                <th className="p-3">Salón ({anio})</th>
                <th className="p-3">Estado de Cuenta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    Consultando estudiantes...
                  </td>
                </tr>
              ) : estudiantes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    No se encontraron estudiantes con ese criterio.
                  </td>
                </tr>
              ) : (
                estudiantes.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">{est.dni}</td>
                    <td className="p-3 font-medium text-slate-800">
                      {est.apellidos}, {est.nombres}
                    </td>
                    <td className="p-3 text-xs">
                      {est.grado && est.seccion ? (
                        <span className="px-2.5 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-800">
                          {est.grado} "{est.seccion}"
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin matrícula en {anio}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          est.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {est.activo ? 'Activo' : 'Inactivo'}
                      </span>
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