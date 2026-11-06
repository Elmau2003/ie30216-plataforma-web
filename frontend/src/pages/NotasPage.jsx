// frontend/src/pages/NotasPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function NotasPage() {
  const [salones, setSalones] = useState([]);
  const [salonId, setSalonId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [fechaEval, setFechaEval] = useState(new Date().toISOString().split('T')[0]);
  
  const [evaluacionId, setEvaluacionId] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [notasMap, setNotasMap] = useState({});
  const [observacionesMap, setObservacionesMap] = useState({});

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

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

  const handleCrearEvaluacion = async (e) => {
    e.preventDefault();
    if (!salonId || !titulo || !fechaEval) return;

    setMensaje({ tipo: '', texto: '' });
    setCargando(true);

    try {
      const res = await fetchAPI('/grades/evaluaciones', {
        method: 'POST',
        body: JSON.stringify({
          salonId: parseInt(salonId),
          titulo,
          fecha: fechaEval,
        }),
      });

      setEvaluacionId(res.evaluacion.id);
      setMensaje({ tipo: 'exito', texto: 'Evaluación registrada. Proceda a ingresar las calificaciones.' });

      // Cargar estudiantes del salón
      const resEst = await fetchAPI(`/attendance/salon/${salonId}?fecha=${fechaEval}`);
      setEstudiantes(resEst);

      const notasIniciales = {};
      const obsIniciales = {};
      resEst.forEach((est) => {
        notasIniciales[est.estudiante_id] = 'A';
        obsIniciales[est.estudiante_id] = '';
      });
      setNotasMap(notasIniciales);
      setObservacionesMap(obsIniciales);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarNotas = async (e) => {
    e.preventDefault();
    if (!evaluacionId) return;

    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    const payloadNotas = estudiantes.map((est) => ({
      estudianteId: est.estudiante_id,
      calificacionLetra: notasMap[est.estudiante_id] || 'A',
      observaciones: observacionesMap[est.estudiante_id] || '',
    }));

    try {
      await fetchAPI('/grades/registrar-notas', {
        method: 'POST',
        body: JSON.stringify({
          evaluacionId: parseInt(evaluacionId),
          notas: payloadNotas,
        }),
      });
      setMensaje({ tipo: 'exito', texto: 'Calificaciones CNEB guardadas correctamente' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Registro de Calificaciones (CNEB)</h2>

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

      {/* Formulario 1: Crear Evaluación */}
      <form onSubmit={handleCrearEvaluacion} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-md font-semibold text-slate-700">1. Crear Criterio o Actividad de Evaluación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Salón</label>
            <select
              value={salonId}
              onChange={(e) => setSalonId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {salones.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.grado} "{s.seccion}" ({s.anio_escolar})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Título de la Evaluación</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Práctica Calificada de Matemática"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
            <input
              type="date"
              value={fechaEval}
              onChange={(e) => setFechaEval(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={cargando}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2 rounded-lg text-sm shadow-xs transition"
          >
            {cargando ? 'Generando...' : 'Iniciar Registro de Notas'}
          </button>
        </div>
      </form>

      {/* Tabla de Notas CNEB */}
      {evaluacionId && (
        <form onSubmit={handleGuardarNotas} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-md font-semibold text-slate-700">
              2. Asignar Logro de Aprendizaje: <span className="text-purple-700">{titulo}</span>
            </h3>
          </div>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Estudiante</th>
                <th className="p-4 text-center">Nivel de Logro (CNEB)</th>
                <th className="p-4">Conclusión Descriptiva / Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estudiantes.map((est) => (
                <tr key={est.estudiante_id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">
                    {est.apellidos}, {est.nombres}
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex gap-2">
                      {[
                        { letra: 'AD', label: 'AD - Sobresaliente', color: 'bg-emerald-600' },
                        { letra: 'A', label: 'A - Logrado', color: 'bg-blue-600' },
                        { letra: 'B', label: 'B - En Proceso', color: 'bg-amber-500' },
                        { letra: 'C', label: 'C - En Inicio', color: 'bg-red-600' },
                      ].map((item) => (
                        <button
                          key={item.letra}
                          type="button"
                          onClick={() => setNotasMap((prev) => ({ ...prev, [est.estudiante_id]: item.letra }))}
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
                  <td className="p-4">
                    <input
                      type="text"
                      value={observacionesMap[est.estudiante_id] || ''}
                      onChange={(e) =>
                        setObservacionesMap({
                          ...observacionesMap,
                          [est.estudiante_id]: e.target.value,
                        })
                      }
                      placeholder="Comentario pedagógico..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 rounded-lg text-sm shadow-xs transition disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar Calificaciones'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}