// frontend/src/pages/EstudiantePage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EstudiantePage() {
  const { usuario } = useAuth();
  const [libreta, setLibreta] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [aniosHistorial, setAniosHistorial] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [bimestreFiltro, setBimestreFiltro] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const bimestres = ['I Bimestre', 'II Bimestre', 'III Bimestre', 'IV Bimestre'];

  useEffect(() => {
    const cargarAnios = async () => {
      try {
        const data = await fetchAPI(`/grades/estudiante/${usuario.id}/anios-historial`);
        setAniosHistorial(data);
        if (data.length > 0) {
          setAnioSeleccionado(data[0].anio_escolar);
        }
      } catch (err) {
        console.error('Error al cargar historial de años:', err);
      }
    };
    if (usuario?.id) cargarAnios();
  }, [usuario]);

  useEffect(() => {
    const cargarDatosAnio = async () => {
      try {
        setCargando(true);
        const [resNotas, resAsistencia] = await Promise.all([
          fetchAPI(`/grades/estudiante/${usuario.id}?anio=${anioSeleccionado}`),
          fetchAPI(`/attendance/estudiante/${usuario.id}?anio=${anioSeleccionado}`).catch(() => []),
        ]);
        setLibreta(resNotas);
        setAsistencias(resAsistencia);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    if (usuario?.id && anioSeleccionado) {
      cargarDatosAnio();
    }
  }, [usuario, anioSeleccionado]);

  // Filtrar calificaciones por el bimestre seleccionado
  const libretaFiltrada = libreta.filter(
    (item) => bimestreFiltro === 'TODOS' || item.periodo === bimestreFiltro
  );

  // Agrupar calificaciones filtradas por Área Curricular
  const libretaPorCurso = libretaFiltrada.reduce((acc, curr) => {
    if (!acc[curr.curso]) acc[curr.curso] = [];
    acc[curr.curso].push(curr);
    return acc;
  }, {});

  const totalClases = asistencias.length;
  const presentes = asistencias.filter((a) => a.estado === 'PRESENTE').length;
  const faltas = asistencias.filter((a) => a.estado === 'FALTA').length;
  const tardanzas = asistencias.filter((a) => a.estado === 'TARDANZA').length;
  const justificadas = asistencias.filter((a) => a.estado === 'JUSTIFICADO').length;

  const porcentajeAsistencia = totalClases > 0
    ? Math.round(((presentes + tardanzas) / totalClases) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Mi Libreta y Récord Escolar</h2>
          <p className="text-xs text-slate-500">I.E. 30216 Sagrado Corazón de María</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Bimestre */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <label className="text-xs font-semibold text-slate-600">Bimestre:</label>
            <select
              value={bimestreFiltro}
              onChange={(e) => setBimestreFiltro(e.target.value)}
              className="text-xs font-bold text-purple-700 bg-transparent border-0 focus:outline-none"
            >
              <option value="TODOS">-- Todos --</option>
              {bimestres.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Selector de Año Escolar */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <label className="text-xs font-semibold text-slate-600">Año Lectivo:</label>
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="text-xs font-bold text-blue-700 bg-transparent border-0 focus:outline-none"
            >
              {aniosHistorial.length === 0 ? (
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              ) : (
                aniosHistorial.map((h) => (
                  <option key={h.anio_escolar} value={h.anio_escolar}>
                    {h.anio_escolar} ({h.grado}° "{h.seccion}")
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Tarjetas de Resumen de Asistencia */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Asistencia Global</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{porcentajeAsistencia}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Asistencias</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{presentes}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Tardanzas</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{tardanzas}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase">Faltas</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{faltas}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-slate-500 uppercase">Justificadas</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{justificadas}</p>
        </div>
      </div>

      {/* Libreta de Notas CNEB agrupada por Área Curricular */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">
          Calificaciones CNEB {bimestreFiltro !== 'TODOS' ? `- ${bimestreFiltro}` : ''} ({anioSeleccionado})
        </h3>

        {cargando ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400">
            Cargando expediente del año {anioSeleccionado}...
          </div>
        ) : Object.keys(libretaPorCurso).length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-400">
            No se encontraron calificaciones registradas en el período seleccionado.
          </div>
        ) : (
          Object.entries(libretaPorCurso).map(([nombreCurso, evaluacionesList]) => (
            <div key={nombreCurso} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-purple-50/60 border-b border-purple-100 flex justify-between items-center">
                <h4 className="font-bold text-purple-900 text-base">{nombreCurso}</h4>
                <span className="text-xs text-purple-700 font-medium">
                  {evaluacionesList.length} evaluació(n/es)
                </span>
              </div>
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Bimestre</th>
                    <th className="p-3">Evaluación</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3 text-center">Nivel de Logro</th>
                    <th className="p-3">Conclusión Descriptiva / Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluacionesList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-xs text-blue-800">{item.periodo}</td>
                      <td className="p-3 font-medium text-slate-800">{item.evaluacion}</td>
                      <td className="p-3 font-mono text-xs text-slate-400">{item.fecha}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${
                            item.calificacion_letra === 'AD'
                              ? 'bg-emerald-600'
                              : item.calificacion_letra === 'A'
                              ? 'bg-blue-600'
                              : item.calificacion_letra === 'B'
                              ? 'bg-amber-500'
                              : item.calificacion_letra === 'C'
                              ? 'bg-red-600'
                              : 'bg-slate-300 text-slate-600'
                          }`}
                        >
                          {item.calificacion_letra || 'Sin evaluar'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-600">
                        {item.observaciones || <span className="text-slate-400 italic">Sin observaciones</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}