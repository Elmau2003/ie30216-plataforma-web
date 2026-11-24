// frontend/src/pages/NotasPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

export default function NotasPage() {
  const { usuario } = useAuth();
  const [salones, setSalones] = useState([]);
  const [salonId, setSalonId] = useState('');
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cursoFiltro, setCursoFiltro] = useState('TODOS');
  const [periodoFiltro, setPeriodoFiltro] = useState('TODOS');

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [evaluacionCalificar, setEvaluacionCalificar] = useState(null);

  // Estado Formulario Crear
  const [curso, setCurso] = useState('Matemática');
  const [titulo, setTitulo] = useState('');
  const [fechaEval, setFechaEval] = useState(new Date().toISOString().split('T')[0]);
  const [periodo, setPeriodo] = useState('I Bimestre');

  // Estado Formulario Calificar (Modal)
  const [estudiantes, setEstudiantes] = useState([]);
  const [notasMap, setNotasMap] = useState({});
  const [observacionesMap, setObservacionesMap] = useState({});

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const areasCurriculares = [
    'Matemática',
    'Comunicación',
    'Personal Social',
    'Ciencia y Tecnología',
    'Arte y Cultura',
    'Educación Religiosa',
    'Educación Física',
    'Inglés',
  ];

  const bimestres = ['I Bimestre', 'II Bimestre', 'III Bimestre', 'IV Bimestre'];

  useEffect(() => {
    const cargarSalonesSegunRol = async () => {
      try {
        if (usuario.rol === 'DOCENTE') {
          const data = await fetchAPI('/classrooms/mi-salon-asignado');
          if (data.asignado) {
            setSalones([data.salon]);
            setSalonId(data.salon.id.toString());
          } else {
            setMensaje({ tipo: 'error', texto: 'No tiene un salón asignado para este año escolar.' });
          }
        } else {
          const data = await fetchAPI('/classrooms');
          setSalones(data);
          if (data.length > 0) setSalonId(data[0].id.toString());
        }
      } catch (err) {
        setMensaje({ tipo: 'error', texto: err.message });
      }
    };
    if (usuario?.rol) cargarSalonesSegunRol();
  }, [usuario]);

  const cargarEvaluaciones = async () => {
    if (!salonId) return;
    setCargando(true);
    try {
      const data = await fetchAPI(`/grades/evaluaciones/salon/${salonId}?periodo=${periodoFiltro}`);
      setEvaluaciones(data);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEvaluaciones();
  }, [salonId, periodoFiltro]);

  const evaluacionesFiltradas = evaluaciones.filter(
    (ev) => cursoFiltro === 'TODOS' || ev.curso === cursoFiltro
  );

  const handleExportarExcelNotas = async () => {
    if (!salonId || cursoFiltro === 'TODOS') {
      setMensaje({ tipo: 'error', texto: 'Seleccione un curso específico para exportar el registro de notas.' });
      return;
    }

    setExportando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { evaluaciones: evList, registros } = await fetchAPI(
        `/grades/reporte-curso/${salonId}?curso=${cursoFiltro}&periodo=${periodoFiltro}`
      );

      if (evList.length === 0) {
        setMensaje({ tipo: 'error', texto: `No existen evaluaciones registradas para ${cursoFiltro}.` });
        return;
      }

      const mapaEstudiantes = {};
      registros.forEach((r) => {
        if (!mapaEstudiantes[r.estudiante_id]) {
          mapaEstudiantes[r.estudiante_id] = {
            dni: r.dni,
            apellidosNombres: `${r.apellidos}, ${r.nombres}`,
            notas: {},
          };
        }
        if (r.evaluacion_id) {
          mapaEstudiantes[r.estudiante_id].notas[r.evaluacion_id] = r.calificacion_letra;
        }
      });

      const listaEstudiantes = Object.values(mapaEstudiantes).sort((a, b) =>
        a.apellidosNombres.localeCompare(b.apellidosNombres)
      );

      const dataExcel = listaEstudiantes.map((est, index) => {
        const fila = {
          'N° orden': index + 1,
          'DNI': est.dni,
          'Nombres y Apellidos': est.apellidosNombres,
        };

        evList.forEach((ev) => {
          const nombreColumna = `${ev.titulo} [${ev.periodo}] (${ev.fecha_fmt})`;
          fila[nombreColumna] = est.notas[ev.id] || '-';
        });

        return fila;
      });

      const salonInfo = salones.find((s) => s.id.toString() === salonId);
      const nombreSalon = salonInfo ? `${salonInfo.grado}_${salonInfo.seccion}` : 'salon';

      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Notas ${cursoFiltro}`);

      XLSX.writeFile(workbook, `Registro_Notas_${cursoFiltro}_${nombreSalon}.xlsx`);
      setMensaje({ tipo: 'exito', texto: `Registro de ${cursoFiltro} exportado en Excel correctamente.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setExportando(false);
    }
  };

  const handleCrearEvaluacion = async (e) => {
    e.preventDefault();
    if (!salonId || !curso || !titulo || !fechaEval || !periodo) return;

    setGuardando(true);
    try {
      await fetchAPI('/grades/evaluaciones', {
        method: 'POST',
        body: JSON.stringify({
          salonId: parseInt(salonId, 10),
          curso,
          titulo,
          fecha: fechaEval,
          periodo,
        }),
      });

      setMensaje({ tipo: 'exito', texto: 'Evaluación registrada correctamente.' });
      setTitulo('');
      setModalCrearAbierto(false);
      cargarEvaluaciones();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalCalificar = async (evaluacion) => {
    setEvaluacionCalificar(evaluacion);
    setCargando(true);

    try {
      const resEst = await fetchAPI(`/attendance/salon/${salonId}?fecha=${evaluacion.fecha}`);
      const listaOrdenada = resEst.sort((a, b) => a.apellidos.localeCompare(b.apellidos));
      setEstudiantes(listaOrdenada);

      let notasExistentes = [];
      try {
        notasExistentes = await fetchAPI(`/grades/evaluacion/${evaluacion.id}`);
      } catch (errNotas) {
        console.error('Sin notas previas:', errNotas);
      }

      const mapaNotasExistentes = {};
      const mapaObsExistentes = {};
      notasExistentes.forEach((n) => {
        mapaNotasExistentes[n.estudiante_id] = n.calificacion_letra;
        mapaObsExistentes[n.estudiante_id] = n.observaciones || '';
      });

      const notasIniciales = {};
      const obsIniciales = {};
      listaOrdenada.forEach((est) => {
        notasIniciales[est.estudiante_id] = mapaNotasExistentes[est.estudiante_id] ?? null;
        obsIniciales[est.estudiante_id] = mapaObsExistentes[est.estudiante_id] ?? '';
      });

      setNotasMap(notasIniciales);
      setObservacionesMap(obsIniciales);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setCargando(false);
    }
  };

  const toggleNota = (estudianteId, letra) => {
    setNotasMap((prev) => ({
      ...prev,
      [estudianteId]: prev[estudianteId] === letra ? null : letra,
    }));
  };

  const handleGuardarNotas = async (e) => {
    e.preventDefault();
    if (!evaluacionCalificar) return;

    setGuardando(true);
    const payloadNotas = estudiantes.map((est) => ({
      estudianteId: est.estudiante_id,
      calificacionLetra: notasMap[est.estudiante_id] ?? null,
      observaciones: observacionesMap[est.estudiante_id] || '',
    }));

    try {
      await fetchAPI('/grades/registrar-notas', {
        method: 'POST',
        body: JSON.stringify({
          evaluacionId: parseInt(evaluacionCalificar.id, 10),
          notas: payloadNotas,
        }),
      });
      setMensaje({ tipo: 'exito', texto: `Notas guardadas correctamente para "${evaluacionCalificar.titulo}".` });
      setEvaluacionCalificar(null);
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
          <h2 className="text-xl font-bold text-slate-800">Evaluaciones y Notas CNEB</h2>
          <p className="text-xs text-slate-500">Gestione los criterios de evaluación por bimestre y salón</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportarExcelNotas}
            disabled={exportando || cursoFiltro === 'TODOS'}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {exportando ? 'Exportando...' : 'Exportar Registro (.xlsx)'}
          </button>
          <button
            type="button"
            onClick={() => setModalCrearAbierto(true)}
            disabled={salones.length === 0}
            className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            + Nueva Evaluación
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

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 sm:gap-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0">
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Salón:</label>
          <select
            value={salonId}
            onChange={(e) => setSalonId(e.target.value)}
            disabled={usuario?.rol === 'DOCENTE'}
            className="w-full sm:w-auto min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:bg-slate-100 font-medium"
          >
            {salones.map((s) => (
              <option key={s.id} value={s.id}>
                {s.grado} "{s.seccion}" ({s.anio_escolar || new Date().getFullYear()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0">
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Bimestre:</label>
          <select
            value={periodoFiltro}
            onChange={(e) => setPeriodoFiltro(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-blue-50/50 text-blue-900 font-medium"
          >
            <option value="TODOS">-- Todos los Bimestres --</option>
            {bimestres.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0">
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Curso / Área:</label>
          <select
            value={cursoFiltro}
            onChange={(e) => setCursoFiltro(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-purple-50/50 text-purple-900 font-medium"
          >
            <option value="TODOS">-- Todos los Cursos --</option>
            {areasCurriculares.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Tarjetas */}
      {cargando && !evaluacionCalificar ? (
        <div className="p-8 text-center text-slate-400">Cargando evaluaciones...</div>
      ) : evaluacionesFiltradas.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
          No se encontraron evaluaciones registradas con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
          {evaluacionesFiltradas.map((ev) => (
            <div
              key={ev.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition min-w-0"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                    {ev.curso}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 whitespace-nowrap">
                    {ev.periodo}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base leading-snug break-words">{ev.titulo}</h3>
                <p className="text-xs text-slate-400 font-mono">Fecha: {ev.fecha}</p>
                <p className="text-xs text-slate-500 break-words">Docente: {ev.docente}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => abrirModalCalificar(ev)}
                  className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Calificar / Ver Notas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Crear Evaluación */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-xl border border-slate-200 my-auto min-w-0">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Nueva Evaluación</h3>
            <form onSubmit={handleCrearEvaluacion} className="space-y-4">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Período / Bimestre</label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-blue-50/40 text-blue-900 font-semibold"
                >
                  {bimestres.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Área Curricular / Curso</label>
                <select
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {areasCurriculares.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Título de la Evaluación</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Examen Bimestral de Comprensión"
                  required
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de la Evaluación</label>
                <input
                  type="date"
                  value={fechaEval}
                  onChange={(e) => setFechaEval(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Crear Evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Calificar */}
      {evaluacionCalificar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl border border-slate-200 my-4 sm:my-8 flex flex-col max-h-[90vh] min-w-0">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-start gap-2 bg-slate-50 rounded-t-xl min-w-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                    {evaluacionCalificar.curso}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 whitespace-nowrap">
                    {evaluacionCalificar.periodo}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1 break-words">
                  {evaluacionCalificar.titulo}
                </h3>
                <p className="text-xs text-slate-500">Fecha: {evaluacionCalificar.fecha}</p>
              </div>
              <button
                type="button"
                onClick={() => setEvaluacionCalificar(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2 cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarNotas} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-w-0">
              <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm text-slate-600 min-w-[680px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-3 w-12 whitespace-nowrap">N°</th>
                      <th className="p-3 whitespace-nowrap">Estudiante</th>
                      <th className="p-3 text-center whitespace-nowrap">Nivel de Logro CNEB</th>
                      <th className="p-3 whitespace-nowrap">Conclusión Descriptiva</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estudiantes.map((est, index) => (
                      <tr key={est.estudiante_id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-xs text-slate-400 whitespace-nowrap">{index + 1}</td>
                        <td className="p-3 font-medium text-slate-800 whitespace-nowrap">
                          {est.apellidos}, {est.nombres}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="inline-flex gap-1.5">
                            {[
                              { letra: 'AD', color: 'bg-emerald-600' },
                              { letra: 'A', color: 'bg-blue-600' },
                              { letra: 'B', color: 'bg-amber-500' },
                              { letra: 'C', color: 'bg-red-600' },
                            ].map((item) => (
                              <button
                                key={item.letra}
                                type="button"
                                onClick={() => toggleNota(est.estudiante_id, item.letra)}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                  notasMap[est.estudiante_id] === item.letra
                                    ? `${item.color} text-white shadow-xs`
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {item.letra}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={observacionesMap[est.estudiante_id] || ''}
                            onChange={(e) =>
                              setObservacionesMap({
                                ...observacionesMap,
                                [est.estudiante_id]: e.target.value,
                              })
                            }
                            placeholder="Observación..."
                            className="w-full min-w-[180px] px-3 py-1 border border-slate-300 rounded-md text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setEvaluacionCalificar(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Calificaciones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}