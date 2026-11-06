// frontend/src/pages/SalonesPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function SalonesPage() {
  const [salones, setSalones] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Formulario Crear Salón
  const [grado, setGrado] = useState('1ro');
  const [seccion, setSeccion] = useState('A');
  const [anioEscolar, setAnioEscolar] = useState(new Date().getFullYear());

  // Formulario Asignar Docente
  const [salonDocenteId, setSalonDocenteId] = useState('');
  const [docenteId, setDocenteId] = useState('');

  // Formulario Matricular Estudiante
  const [salonMatriculaId, setSalonMatriculaId] = useState('');
  const [estudianteId, setEstudianteId] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resSalones, resUsuarios] = await Promise.all([
        fetchAPI('/classrooms'),
        fetchAPI('/users'),
      ]);

      setSalones(resSalones);
      setDocentes(resUsuarios.filter((u) => u.rol === 'DOCENTE' && u.activo));
      setEstudiantes(resUsuarios.filter((u) => u.rol === 'ESTUDIANTE' && u.activo));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const limpiarMensajes = () => {
    setError('');
    setExito('');
  };

  // 1. Crear Salón
  const handleCrearSalon = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    try {
      await fetchAPI('/classrooms', {
        method: 'POST',
        body: JSON.stringify({ grado, seccion, anioEscolar: parseInt(anioEscolar) }),
      });
      setExito('Salón creado exitosamente');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  // 2. Asignar Docente
  const handleAsignarDocente = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    if (!salonDocenteId || !docenteId) {
      setError('Selecciona un salón y un docente');
      return;
    }

    try {
      await fetchAPI('/classrooms/asignar-docente', {
        method: 'POST',
        body: JSON.stringify({
          salonId: parseInt(salonDocenteId),
          docenteId: parseInt(docenteId),
        }),
      });
      setExito('Docente asignado al salón correctamente');
    } catch (err) {
      setError(err.message);
    }
  };

  // 3. Matricular Estudiante
  const handleMatricularEstudiante = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    if (!salonMatriculaId || !estudianteId) {
      setError('Selecciona un salón y un estudiante');
      return;
    }

    try {
      await fetchAPI('/classrooms/matricular', {
        method: 'POST',
        body: JSON.stringify({
          salonId: parseInt(salonMatriculaId),
          estudianteId: parseInt(estudianteId),
        }),
      });
      setExito('Estudiante matriculado exitosamente');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Gestión de Salones y Matrículas</h2>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {exito && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded">
          {exito}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario 1: Crear Salón */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-slate-700 mb-4">1. Crear Nuevo Salón</h3>
            <form onSubmit={handleCrearSalon} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Grado</label>
                <select
                  value={grado}
                  onChange={(e) => setGrado(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="1ro">1ro de Primaria</option>
                  <option value="2do">2do de Primaria</option>
                  <option value="3ro">3ro de Primaria</option>
                  <option value="4to">4to de Primaria</option>
                  <option value="5to">5to de Primaria</option>
                  <option value="6to">6to de Primaria</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sección</label>
                <input
                  type="text"
                  maxLength={5}
                  value={seccion}
                  onChange={(e) => setSeccion(e.target.value)}
                  required
                  placeholder="Ej: A, B, Única"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Año Escolar</label>
                <input
                  type="number"
                  value={anioEscolar}
                  onChange={(e) => setAnioEscolar(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm shadow-xs transition"
              >
                Crear Salón
              </button>
            </form>
          </div>
        </div>

        {/* Formulario 2: Asignar Docente */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-slate-700 mb-4">2. Asignar Docente a Salón</h3>
            <form onSubmit={handleAsignarDocente} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Seleccionar Salón</label>
                <select
                  value={salonDocenteId}
                  onChange={(e) => setSalonDocenteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Seleccionar --</option>
                  {salones.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.grado} "{s.seccion}" - {s.anio_escolar}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Seleccionar Docente</label>
                <select
                  value={docenteId}
                  onChange={(e) => setDocenteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Seleccionar --</option>
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombres} {d.apellidos} ({d.dni})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg text-sm shadow-xs transition"
              >
                Asignar Docente
              </button>
            </form>
          </div>
        </div>

        {/* Formulario 3: Matricular Estudiante */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-slate-700 mb-4">3. Matricular Estudiante</h3>
            <form onSubmit={handleMatricularEstudiante} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Seleccionar Salón</label>
                <select
                  value={salonMatriculaId}
                  onChange={(e) => setSalonMatriculaId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Seleccionar --</option>
                  {salones.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.grado} "{s.seccion}" - {s.anio_escolar}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Seleccionar Estudiante</label>
                <select
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Seleccionar --</option>
                  {estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombres} {est.apellidos} ({est.dni})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm shadow-xs transition"
              >
                Matricular Estudiante
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabla de Salones Existentes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-md font-semibold text-slate-700">Lista de Salones Registrados</h3>
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Grado y Sección</th>
              <th className="p-4">Docente(s) Asignado(s)</th>
              <th className="p-4">Año Escolar</th>
              <th className="p-4 text-center">Total Estudiantes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">
                  Cargando salones...
                </td>
              </tr>
            ) : salones.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">
                  No hay salones registrados.
                </td>
              </tr>
            ) : (
              salones.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-xs">{s.id}</td>
                  <td className="p-4 font-medium text-slate-800">
                    {s.grado} "{s.seccion}"
                  </td>
                  <td className="p-4 text-slate-700">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                      s.docentes_asignados === 'Sin docente asignado' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {s.docentes_asignados}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{s.anio_escolar}</td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded-full text-xs">
                      {s.total_estudiantes || 0} estudiantes
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}