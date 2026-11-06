// frontend/src/pages/AsistenciaPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import * as XLSX from 'xlsx';

export default function AsistenciaPage() {
  const [salones, setSalones] = useState([]);
  const [salonSeleccionado, setSalonSeleccionado] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistenciasMap, setAsistenciasMap] = useState({});
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [esFinDeSemana, setEsFinDeSemana] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estados para el reporte mensual
  const [mesReporte, setMesReporte] = useState(new Date().getMonth() + 1); // 1 a 12
  const [anioReporte, setAnioReporte] = useState(new Date().getFullYear());

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Validar si la fecha cae sábado (6) o domingo (0)
  const validarFinDeSemana = (fechaStr) => {
    const d = new Date(fechaStr + 'T00:00:00');
    const day = d.getDay();
    const esFDS = day === 0 || day === 6;
    setEsFinDeSemana(esFDS);
    if (esFDS) {
      setMensaje({
        tipo: 'error',
        texto: 'La fecha seleccionada corresponde a un fin de semana (sábado/domingo). No se registran asistencias.',
      });
    } else {
      setMensaje({ tipo: '', texto: '' });
    }
  };

  useEffect(() => {
    const cargarSalones = async () => {
      try {
        const data = await fetchAPI('/classrooms');
        setSalones(data);
        if (data.length > 0) setSalonSeleccionado(data[0].id.toString());
      } catch (err) {
        setMensaje({ tipo: 'error', texto: err.message });
      }
    };
    cargarSalones();
  }, []);

  const cargarAsistenciaSalon = async () => {
    validarFinDeSemana(fecha);
    if (!salonSeleccionado || !fecha || esFinDeSemana) return;
    setCargando(true);

    try {
      const data = await fetchAPI(`/attendance/salon/${salonSeleccionado}?fecha=${fecha}`);
      // Orden alfabético por apellidos
      const listaOrdenada = data.sort((a, b) => a.apellidos.localeCompare(b.apellidos));
      setEstudiantes(listaOrdenada);

      const mapaInicial = {};
      listaOrdenada.forEach((est) => {
        mapaInicial[est.estudiante_id] = est.estado || 'PRESENTE';
      });
      setAsistenciasMap(mapaInicial);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAsistenciaSalon();
  }, [salonSeleccionado, fecha]);

  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    setFecha(nuevaFecha);
    validarFinDeSemana(nuevaFecha);
  };

  const handleEstadoChange = (estudianteId, nuevoEstado) => {
    if (esFinDeSemana) return;
    setAsistenciasMap((prev) => ({
      ...prev,
      [estudianteId]: nuevoEstado,
    }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (esFinDeSemana) return;

    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    const payloadAsistencias = Object.entries(asistenciasMap).map(([estudianteId, estado]) => ({
      estudianteId: parseInt(estudianteId),
      estado,
    }));

    try {
      await fetchAPI('/attendance/registrar', {
        method: 'POST',
        body: JSON.stringify({
          salonId: parseInt(salonSeleccionado),
          fecha,
          asistencias: payloadAsistencias,
        }),
      });
      setMensaje({ tipo: 'exito', texto: 'Asistencia registrada correctamente' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Generar Reporte Mensual en Excel (Matriz Lunes a Viernes)
  const handleExportarReporteMensual = async () => {
    if (!salonSeleccionado) return;
    setExportando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // 1. Petición a la API para obtener registros del mes
      const rawData = await fetchAPI(
        `/attendance/salon/${salonSeleccionado}/mes?anio=${anioReporte}&mes=${mesReporte}`
      );

      // 2. Calcular los días hábiles (Lunes a Viernes) del mes seleccionado
      const diasHabiles = [];
      const totalDiasMes = new Date(anioReporte, mesReporte, 0).getDate();

      for (let dia = 1; dia <= totalDiasMes; dia++) {
        const fechaObj = new Date(anioReporte, mesReporte - 1, dia);
        const diaSemana = fechaObj.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) { // Excluir Sábados (6) y Domingos (0)
          const isoFecha = `${anioReporte}-${String(mesReporte).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          const formatoCabecera = `${String(dia).padStart(2, '0')}/${String(mesReporte).padStart(2, '0')}/${anioReporte}`;
          diasHabiles.push({ isoFecha, formatoCabecera });
        }
      }

      // 3. Organizar datos por estudiante
      const mapaEstudiantes = {};
      rawData.forEach((row) => {
        if (!mapaEstudiantes[row.estudiante_id]) {
          mapaEstudiantes[row.estudiante_id] = {
            id: row.estudiante_id,
            dni: row.dni,
            apellidosNombres: `${row.apellidos}, ${row.nombres}`,
            asistencias: {},
          };
        }
        if (row.fecha) {
          mapaEstudiantes[row.estudiante_id].asistencias[row.fecha] = row.estado;
        }
      });

      // 4. Construir las filas ordenadas alfabéticamente por apellido
      const listaEstudiantes = Object.values(mapaEstudiantes).sort((a, b) =>
        a.apellidosNombres.localeCompare(b.apellidosNombres)
      );

      const dataExcel = listaEstudiantes.map((est, index) => {
        const fila = {
          'N°': index + 1,
          'DNI': est.dni,
          'Apellidos y Nombres': est.apellidosNombres,
        };

        // Columna dinámica para cada día hábil del mes
        diasHabiles.forEach((dh) => {
          fila[dh.formatoCabecera] = est.asistencias[dh.isoFecha] || '-';
        });

        return fila;
      });

      // 5. Descarga de archivo Excel
      const salonInfo = salones.find((s) => s.id.toString() === salonSeleccionado);
      const nombreSalon = salonInfo ? `${salonInfo.grado}_${salonInfo.seccion}` : 'salon';

      const worksheet = XLSX.utils.json_to_sheet(dataExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia Mensual');

      // Ancho automático de columnas
      worksheet['!cols'] = [
        { wch: 5 },  // N°
        { wch: 12 }, // DNI
        { wch: 30 }, // Apellidos y Nombres
        ...diasHabiles.map(() => ({ wch: 12 })),
      ];

      const mesNombre = mesesNombres[mesReporte - 1];
      XLSX.writeFile(workbook, `Asistencia_${nombreSalon}_${mesNombre}_${anioReporte}.xlsx`);
      setMensaje({ tipo: 'exito', texto: `Reporte mensual de ${mesNombre} descargado exitosamente.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Control Diario de Asistencia</h2>

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

      {/* Tarjetas de Selección y Reporte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Filtro para Registro Diario */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha de Registro</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Salón</label>
              <select
                value={salonSeleccionado}
                onChange={(e) => setSalonSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {salones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.grado} "{s.seccion}" ({s.anio_escolar})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={handleFechaChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  esFinDeSemana ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-300'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Exportador Mensual a Excel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Exportar Reporte Mensual (.xlsx)</h3>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Mes</label>
              <select
                value={mesReporte}
                onChange={(e) => setMesReporte(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {mesesNombres.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-600 mb-1">Año</label>
              <input
                type="number"
                value={anioReporte}
                onChange={(e) => setAnioReporte(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleExportarReporteMensual}
              disabled={exportando}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-xs transition disabled:opacity-50"
            >
              {exportando ? 'Generando...' : 'Descargar Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Asistencia Diaria */}
      <form onSubmit={handleGuardar} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4 w-12">N°</th>
              <th className="p-4">DNI</th>
              <th className="p-4">Apellidos y Nombres</th>
              <th className="p-4 text-center">Estado de Asistencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan={4} className="p-4 text-center text-slate-400">Cargando datos...</td></tr>
            ) : esFinDeSemana ? (
              <tr><td colSpan={4} className="p-6 text-center text-red-500 font-medium">No se registran asistencias sábados ni domingos.</td></tr>
            ) : estudiantes.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-slate-400">No hay estudiantes en este salón.</td></tr>
            ) : (
              estudiantes.map((est, index) => (
                <tr key={est.estudiante_id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono text-xs text-slate-400">{index + 1}</td>
                  <td className="p-4 font-mono text-xs">{est.dni}</td>
                  <td className="p-4 font-medium text-slate-800">{est.apellidos}, {est.nombres}</td>
                  <td className="p-4 text-center">
                    <div className="inline-flex gap-2">
                      {['PRESENTE', 'FALTA', 'TARDANZA', 'JUSTIFICADO'].map((estOp) => (
                        <button
                          key={estOp}
                          type="button"
                          onClick={() => handleEstadoChange(est.estudiante_id, estOp)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                            asistenciasMap[est.estudiante_id] === estOp
                              ? estOp === 'PRESENTE' ? 'bg-emerald-600 text-white shadow-xs'
                              : estOp === 'FALTA' ? 'bg-red-600 text-white shadow-xs'
                              : estOp === 'TARDANZA' ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {estOp}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {estudiantes.length > 0 && !esFinDeSemana && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg text-sm shadow-xs transition disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar Asistencia'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}