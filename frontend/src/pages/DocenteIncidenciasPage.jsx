// frontend/src/pages/DocenteIncidenciasPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function DocenteIncidenciasPage() {
  const [salones, setSalones] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [reportes, setReportes] = useState([]);

  // Formulario
  const [modalAbierto, setModalAbierto] = useState(false);
  const [salonSeleccionado, setSalonSeleccionado] = useState('');
  const [estudianteId, setEstudianteId] = useState('');
  const [tipoIncidencia, setTipoIncidencia] = useState('Indisciplina');
  const [descripcion, setDescripcion] = useState('');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarDatosIniciales = async () => {
    setCargando(true);
    try {
      const [resMiSalon, resReportes] = await Promise.all([
        fetchAPI('/classrooms/mi-salon-asignado').catch(() => ({ asignado: false })),
        fetchAPI('/incidents/docente/mis-reportes').catch(() => []),
      ]);

      if (resMiSalon.asignado) {
        setSalones([resMiSalon.salon]);
        setSalonSeleccionado(resMiSalon.salon.id.toString());
        handleSalonChange(resMiSalon.salon.id.toString());
      } else {
        setSalones([]);
      }

      setReportes(Array.isArray(resReportes) ? resReportes : []);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const handleSalonChange = async (sId) => {
    setSalonSeleccionado(sId);
    setEstudianteId('');
    if (!sId) {
      setEstudiantes([]);
      return;
    }
    try {
      const data = await fetchAPI(`/incidents/estudiantes-salon/${sId}`);
      setEstudiantes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar estudiantes del salón:', err);
    }
  };

  const handleRegistrarIncidencia = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    if (!estudianteId) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar a un estudiante.' });
      setGuardando(false);
      return;
    }

    try {
      await fetchAPI('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          salonId: salonSeleccionado,
          estudianteId,
          tipo: tipoIncidencia,
          descripcion,
        }),
      });

      setMensaje({ tipo: 'exito', texto: 'Incidencia registrada correctamente.' });
      setEstudianteId('');
      setTipoIncidencia('Indisciplina');
      setDescripcion('');
      setModalAbierto(false);
      cargarDatosIniciales();
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
          <h2 className="text-xl font-bold text-slate-800">Registro de Incidencias de Estudiantes</h2>
          <p className="text-xs text-slate-500">Reporte conductual, tardanzas e irresponsabilidad académica</p>
        </div>
        <button
          type="button"
          onClick={() => setModalAbierto(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
        >
          + Registrar Incidencia
        </button>
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

      {/* Historial de incidencias registradas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 text-sm">
          Historial de Reportes Emitidos por el Docente
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[640px]">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 whitespace-nowrap">Estudiante</th>
                <th className="p-3 whitespace-nowrap">Salón</th>
                <th className="p-3 whitespace-nowrap">Tipo de Incidencia</th>
                <th className="p-3 whitespace-nowrap">Detalle / Descripción</th>
                <th className="p-3 whitespace-nowrap">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    Cargando historial de incidencias...
                  </td>
                </tr>
              ) : reportes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    No ha registrado ninguna incidencia hasta el momento.
                  </td>
                </tr>
              ) : (
                reportes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{r.estudiante_nombre}</div>
                      <div className="text-xs text-slate-400 font-mono">DNI: {r.estudiante_dni}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{r.salon_nombre || '-'}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        {r.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-600 max-w-xs truncate" title={r.descripcion}>
                      {r.descripcion}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-400 whitespace-nowrap">{r.fecha}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Incidencia */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-xl border border-slate-200 space-y-4 my-auto min-w-0">
            <h3 className="text-lg font-bold text-slate-800">Nueva Incidencia Conductual</h3>
            <form onSubmit={handleRegistrarIncidencia} className="space-y-4">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">1. Salón Asignado (Año Lectivo)</label>
                <select
                  value={salonSeleccionado}
                  onChange={(e) => handleSalonChange(e.target.value)}
                  required
                  disabled={salones.length === 1}
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100 font-medium"
                >
                  {salones.length === 0 ? (
                    <option value="">-- No tiene salón asignado este año --</option>
                  ) : (
                    salones.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.grado}° "{s.seccion}" ({s.anio_escolar || new Date().getFullYear()})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">2. Seleccionar Estudiante</label>
                <select
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                  required
                  disabled={!salonSeleccionado}
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white disabled:bg-slate-100"
                >
                  <option value="">-- {salonSeleccionado ? 'Seleccionar Estudiante' : 'Sin salón asignado'} --</option>
                  {estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.apellidos}, {est.nombres} (DNI: {est.dni})
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">3. Tipo de Incidencia</label>
                <select
                  value={tipoIncidencia}
                  onChange={(e) => setTipoIncidencia(e.target.value)}
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Indisciplina">Indisciplina en el Aula</option>
                  <option value="Irresponsabilidad">Irresponsabilidad (Sin Tareas / Materiales)</option>
                  <option value="Tardanza">Tardanza Reincidente</option>
                  <option value="Falta de Respeto">Falta de Respeto</option>
                  <option value="Convivencia">Problema de Convivencia Escolar</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">4. Descripción del Hecho</label>
                <textarea
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  placeholder="Detalle lo sucedido y los antecedentes..."
                  className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || salones.length === 0}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}