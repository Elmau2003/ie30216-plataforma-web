// frontend/src/pages/NotasPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import * as XLSX from 'xlsx';

export default function NotasPage() {
  const [salones, setSalones] = useState([]);
  const [salonId, setSalonId] = useState('');
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cursoFiltro, setCursoFiltro] = useState('TODOS');
  
  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [evaluacionCalificar, setEvaluacionCalificar] = useState(null);

  // Estado Formulario Crear
  const [curso, setCurso] = useState('Matemática');
  const [titulo, setTitulo] = useState('');
  const [fechaEval, setFechaEval] = useState(new Date().toISOString().split('T')[0]);

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

  useEffect(() => {
    const cargarSalones = async () => {
      try {
        const data = await fetchAPI('/classrooms');
        setSalones(data);
        if (data.length > 0) setSalonId(data[0].id.toString());
      } catch (err) {
        setMensaje({ tipo: 'error', texto: err.message });
      }
    };
    cargarSalones();
  }, []);

  const cargarEvaluaciones = async () => {
    if (!salonId) return;
    setCargando(true);
    try {
      const data = await fetchAPI(`/grades/evaluaciones/salon/${salonId}`);
      setEvaluaciones(data);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEvaluaciones();
  }, [salonId]);

  const evaluacionesFiltradas = evaluaciones.filter(
    (ev) => cursoFiltro === 'TODOS' || ev.curso === cursoFiltro
  );

  // Exportar Registro Oficial de Notas por Curso a Excel
  const handleExportarExcelNotas = async () => {
    if (!salonId || cursoFiltro === 'TODOS') {
      setMensaje({ tipo: 'error', texto: 'Seleccione un curso específico para exportar el registro de notas.' });
      return;
    }

    setExportando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const { evaluaciones: evList, registros } = await fetchAPI(
        `/grades/reporte-curso/${salonId}?curso=${cursoFiltro}`
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
          const nombreColumna = `${ev.titulo} (${ev.fecha_fmt})`;
          fila[nombreColumna] = est.notas[ev.id] || '-';
        });

        return fila;
      });

      const salonInfo = salones.find((s) => s.id.toString() === salonId);
      const nombreSalon = salonInfo ? `${salonInfo.grado}_${salonInfo.seccion}` : 'salon';

      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Notas ${cursoFiltro}`);

      worksheet['!cols'] = [
        { wch: 10 },
        { wch: 12 },
        { wch: 32 },
        ...evList.map(() => ({ wch: 22 })),
      ];

      XLSX.writeFile(workbook, `Registro_Notas_${cursoFiltro}_${nombreSalon}.xlsx`);
      setMensaje({ tipo: 'exito', texto: `Registro de ${cursoFiltro} exportado en Excel correctamente.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setExportando(false);
    }
  };

  // Guardar nueva evaluación desde Modal
  const handleCrearEvaluacion = async (e) => {
    e.preventDefault();
    if (!salonId || !curso || !titulo || !fechaEval) return;

    setGuardando(true);
    try {
      await fetchAPI('/grades/evaluaciones', {
        method: 'POST',
        body: JSON.stringify({
          salonId: parseInt(salonId),
          curso,
          titulo,
          fecha: fechaEval,
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

  // Abrir modal para calificar y obtener notas previas
  const abrirModalCalificar = async (evaluacion) => {
    setEvaluacionCalificar(evaluacion);
    setCargando(true);

    try {
      const resEst = await fetchAPI(`/attendance/salon/${salonId}?fecha=${evaluacion.fecha}`);
      const listaOrdenada = resEst.sort((a, b) => a.apellidos.localeCompare(b.apellidos));
      setEstudiantes(listaOrdenada);

      // Obtener notas guardadas previamente para esta evaluación
      let notasExistentes = [];
      try {
        notasExistentes = await fetchAPI(`/grades/evaluacion/${evaluacion.id}`);
      } catch (errNotas) {
        console.error('Sin notas previas:', errNotas);
      }

      const mapaNotasExistentes = {};
      const mapaObsExistentes = {};
      notasExistentes.forEach((n) => {
        mapaNotasExistentes[n.estudiante_id] = n.calificacion_letra; // puede ser AD, A, B, C o null
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

  // Lógica de toggle: al presionar la misma nota elegida, se desmarca a null
  const toggleNota = (estudianteId, letra) => {
    setNotasMap((prev) => ({
      ...prev,
      [estudianteId]: prev[estudianteId] === letra ? null : letra,
    }));
  };

  // Guardar notas desde Modal
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
          evaluacionId: parseInt(evaluacionCalificar.id),
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
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Evaluaciones y Notas CNEB</h2>
          <p className="text-xs text-slate-500">Gestione los criterios de evaluación por curso y salón</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportarExcelNotas}
            disabled={exportando || cursoFiltro === 'TODOS'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition flex items-center gap-2 disabled:opacity-50"
          >
            {exportando ? 'Exportando...' : 'Exportar Registro (.xlsx)'}
          </button>
          <button
            onClick={() => setModalCrearAbierto(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition flex items-center gap-2"
          >
            <span>+</span> Nueva Evaluación
          </button>
        </div>
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

      {/* Barra de Filtros: Salón y Curso */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Salón:</label>
          <select
            value={salonId}
            onChange={(e) => setSalonId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white"
          >
            {salones.map((s) => (
              <option key={s.id} value={s.id}>
                {s.grado} "{s.seccion}" ({s.anio_escolar})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Curso / Área:</label>
          <select
            value={cursoFiltro}
            onChange={(e) => setCursoFiltro(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-purple-50/50 text-purple-900 font-medium"
          >
            <option value="TODOS">-- Todos los Cursos --</option>
            {areasCurriculares.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Tarjetas Filtradas */}
      {cargando && !evaluacionCalificar ? (
        <div className="p-8 text-center text-slate-400">Cargando evaluaciones...</div>
      ) : evaluacionesFiltradas.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
          {cursoFiltro === 'TODOS'
            ? 'No hay evaluaciones registradas en este salón.'
            : `No hay evaluaciones registradas para el curso de ${cursoFiltro}.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evaluacionesFiltradas.map((ev) => (
            <div
              key={ev.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                    {ev.curso}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{ev.fecha}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-base leading-snug">{ev.titulo}</h3>
                <p className="text-xs text-slate-500">Docente: {ev.docente}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => abrirModalCalificar(ev)}
                  className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 py-2 rounded-lg text-xs font-semibold transition"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Nueva Evaluación</h3>
            <form onSubmit={handleCrearEvaluacion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Área Curricular / Curso</label>
                <select
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {areasCurriculares.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Título de la Evaluación</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Práctica de Comprensión Lectora"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de la Evaluación</label>
                <input
                  type="date"
                  value={fechaEval}
                  onChange={(e) => setFechaEval(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  {evaluacionCalificar.curso}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{evaluacionCalificar.titulo}</h3>
                <p className="text-xs text-slate-500">Fecha: {evaluacionCalificar.fecha}</p>
              </div>
              <button
                onClick={() => setEvaluacionCalificar(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarNotas} className="flex-1 overflow-y-auto p-6 space-y-4">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-3 w-12">N°</th>
                    <th className="p-3">Estudiante</th>
                    <th className="p-3 text-center">Nivel de Logro CNEB</th>
                    <th className="p-3">Conclusión Descriptiva</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {estudiantes.map((est, index) => (
                    <tr key={est.estudiante_id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs text-slate-400">{index + 1}</td>
                      <td className="p-3 font-medium text-slate-800">{est.apellidos}, {est.nombres}</td>
                      <td className="p-3 text-center">
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
                              className={`px-3 py-1 rounded-md text-xs font-bold transition ${
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
                          className="w-full px-3 py-1 border border-slate-300 rounded-md text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setEvaluacionCalificar(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-xs disabled:opacity-50"
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