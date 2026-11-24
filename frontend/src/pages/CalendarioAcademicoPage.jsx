// frontend/src/pages/CalendarioAcademicoPage.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const TIPOS_EVENTO = {
  INSTITUCIONAL: {
    label: 'Institucional / Cívico',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
  },
  EVALUACION: {
    label: 'Evaluación / Notas',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  REUNION: {
    label: 'Reunión / Colegiado',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    dot: 'bg-purple-600',
  },
  ACTIVIDAD: {
    label: 'Actividad Escolar / Deporte',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
  },
  FERIADO: {
    label: 'Feriado / Suspensión',
    badge: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-600',
  },
};

function formatearISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarioAcademicoPage() {
  const { usuario } = useAuth();
  const rolActual = String(usuario?.rol || '').toUpperCase();
  const puedeGestionar = ['DIRECTIVO', 'ADMINISTRATIVO'].includes(rolActual);

  const hoy = useMemo(() => new Date(), []);
  const hoyISO = useMemo(() => formatearISO(hoy), [hoy]);

  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [mesActual, setMesActual] = useState(hoy.getMonth()); // 0 - 11
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estado del modal de creación / edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'INSTITUCIONAL',
    fecha_inicio: hoyISO,
    fecha_fin: hoyISO,
    hora_inicio: '',
    hora_fin: '',
    lugar: '',
  });

  const cargarEventos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await fetchAPI(`/calendario?mes=${mesActual + 1}&anio=${anioActual}`);
      setEventos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los eventos académicos');
    } finally {
      setCargando(false);
    }
  }, [mesActual, anioActual]);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  // Generar las celdas del calendario (empezando en Lunes)
  const celdasCalendario = useMemo(() => {
    const primerDiaMes = new Date(anioActual, mesActual, 1);
    const ultimoDiaMes = new Date(anioActual, mesActual + 1, 0);
    const diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7; // Lunes = 0 ... Domingo = 6
    const totalDiasMes = ultimoDiaMes.getDate();

    const celdas = [];
    for (let i = 0; i < diaSemanaInicio; i++) {
      celdas.push(null);
    }
    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const fecha = new Date(anioActual, mesActual, dia);
      celdas.push({
        dia,
        iso: formatearISO(fecha),
      });
    }
    while (celdas.length % 7 !== 0) {
      celdas.push(null);
    }
    return celdas;
  }, [anioActual, mesActual]);

  const eventosFiltrados = useMemo(() => {
    if (filtroTipo === 'TODOS') return eventos;
    return eventos.filter((ev) => ev.tipo === filtroTipo);
  }, [eventos, filtroTipo]);

  const eventosPorDia = useCallback(
    (iso) =>
      eventosFiltrados.filter(
        (ev) => iso >= ev.fecha_inicio && iso <= (ev.fecha_fin || ev.fecha_inicio)
      ),
    [eventosFiltrados]
  );

  const eventosDelDiaSeleccionado = useMemo(
    () => eventosPorDia(fechaSeleccionada),
    [eventosPorDia, fechaSeleccionada]
  );

  const irMesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11);
      setAnioActual((a) => a - 1);
    } else {
      setMesActual((m) => m - 1);
    }
  };

  const irMesSiguiente = () => {
    if (mesActual === 11) {
      setMesActual(0);
      setAnioActual((a) => a + 1);
    } else {
      setMesActual((m) => m + 1);
    }
  };

  const irAHoy = () => {
    setAnioActual(hoy.getFullYear());
    setMesActual(hoy.getMonth());
    setFechaSeleccionada(hoyISO);
  };

  const abrirModalNuevo = (fechaPreseleccionada = fechaSeleccionada) => {
    setEventoEditando(null);
    setForm({
      titulo: '',
      descripcion: '',
      tipo: 'INSTITUCIONAL',
      fecha_inicio: fechaPreseleccionada,
      fecha_fin: fechaPreseleccionada,
      hora_inicio: '',
      hora_fin: '',
      lugar: '',
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (ev) => {
    setEventoEditando(ev);
    setForm({
      titulo: ev.titulo || '',
      descripcion: ev.descripcion || '',
      tipo: ev.tipo || 'INSTITUCIONAL',
      fecha_inicio: ev.fecha_inicio,
      fecha_fin: ev.fecha_fin || ev.fecha_inicio,
      hora_inicio: ev.hora_inicio || '',
      hora_fin: ev.hora_fin || '',
      lugar: ev.lugar || '',
    });
    setModalAbierto(true);
  };

  const handleGuardarEvento = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      if (eventoEditando) {
        await fetchAPI(`/calendario/${eventoEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await fetchAPI('/calendario', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setModalAbierto(false);
      await cargarEventos();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el evento');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarEvento = async (id) => {
    if (!window.confirm('¿Deseas eliminar este evento del calendario académico?')) return;
    try {
      await fetchAPI(`/calendario/${id}`, { method: 'DELETE' });
      await cargarEventos();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el evento');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Controles */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Calendario Académico</h2>
          <p className="text-xs text-slate-500 mt-1">
            {puedeGestionar
              ? 'Programa, actualiza y consulta las actividades, evaluaciones y fechas institucionales.'
              : 'Consulta las fechas de evaluaciones, reuniones y actividades programadas en la I.E. N.° 30216.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
          >
            <option value="TODOS">Todas las categorías</option>
            {Object.entries(TIPOS_EVENTO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={irAHoy}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Hoy
          </button>

          {puedeGestionar && (
            <button
              type="button"
              onClick={() => abrirModalNuevo(fechaSeleccionada)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              + Programar Evento
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded">
          {error}
        </div>
      )}

      {/* Cuerpo Principal: Cuadrícula Mensual + Panel Lateral del Día */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cuadrícula del Mes */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <button
              type="button"
              onClick={irMesAnterior}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
            >
              ← Anterior
            </button>

            <h3 className="text-base font-extrabold text-slate-800">
              {MESES[mesActual]} {anioActual}
            </h3>

            <button
              type="button"
              onClick={irMesSiguiente}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
            >
              Siguiente →
            </button>
          </div>

          {/* Cabecera días de la semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Celdas de días */}
          <div className="grid grid-cols-7">
            {celdasCalendario.map((celda, idx) => {
              if (!celda) {
                return (
                  <div
                    key={`vacio-${idx}`}
                    className="min-h-[96px] border-b border-r border-slate-100 bg-slate-50/50"
                  />
                );
              }

              const eventosDia = eventosPorDia(celda.iso);
              const esHoy = celda.iso === hoyISO;
              const esSeleccionado = celda.iso === fechaSeleccionada;

              return (
                <button
                  key={celda.iso}
                  type="button"
                  onClick={() => setFechaSeleccionada(celda.iso)}
                  className={`min-h-[96px] p-2 border-b border-r border-slate-100 text-left flex flex-col justify-between transition cursor-pointer ${
                    esSeleccionado
                      ? 'bg-blue-50/80 ring-2 ring-inset ring-blue-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        esHoy
                          ? 'bg-blue-600 text-white'
                          : esSeleccionado
                          ? 'text-blue-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {celda.dia}
                    </span>
                    {eventosDia.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {eventosDia.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 w-full mt-1.5 overflow-hidden">
                    {eventosDia.slice(0, 2).map((ev) => {
                      const estilo = TIPOS_EVENTO[ev.tipo] || TIPOS_EVENTO.INSTITUCIONAL;
                      return (
                        <div
                          key={ev.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border ${estilo.badge}`}
                          title={ev.titulo}
                        >
                          {ev.titulo}
                        </div>
                      );
                    })}
                    {eventosDia.length > 2 && (
                      <p className="text-[10px] font-bold text-blue-600 pl-1">
                        +{eventosDia.length - 2} más
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agenda del Día Seleccionado */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Agenda del Día
                </p>
                <h4 className="text-base font-extrabold text-slate-800">{fechaSeleccionada}</h4>
              </div>
              {puedeGestionar && (
                <button
                  type="button"
                  onClick={() => abrirModalNuevo(fechaSeleccionada)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  + Agregar aquí
                </button>
              )}
            </div>

            {cargando ? (
              <p className="text-xs text-slate-500 py-8 text-center">Cargando eventos...</p>
            ) : eventosDelDiaSeleccionado.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-600">
                  Sin eventos programados
                </p>
                <p className="text-xs text-slate-400">
                  No hay actividades registradas para esta fecha.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {eventosDelDiaSeleccionado.map((ev) => {
                  const estilo = TIPOS_EVENTO[ev.tipo] || TIPOS_EVENTO.INSTITUCIONAL;
                  return (
                    <div
                      key={ev.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${estilo.badge}`}
                        >
                          {estilo.label}
                        </span>
                        {puedeGestionar && (
                          <div className="flex items-center gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(ev)}
                              className="text-blue-600 hover:underline font-medium cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminarEvento(ev.id)}
                              className="text-red-600 hover:underline font-medium cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>

                      <h5 className="font-bold text-slate-800 text-sm">{ev.titulo}</h5>

                      {ev.descripcion && (
                        <p className="text-xs text-slate-600 leading-relaxed">{ev.descripcion}</p>
                      )}

                      <div className="pt-1 text-[11px] text-slate-500 space-y-0.5">
                        <p>
                          <strong>Fechas:</strong> {ev.fecha_inicio}
                          {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio
                            ? ` al ${ev.fecha_fin}`
                            : ''}
                        </p>
                        {(ev.hora_inicio || ev.hora_fin) && (
                          <p>
                            <strong>Horario:</strong> {ev.hora_inicio || '--:--'}
                            {ev.hora_fin ? ` - ${ev.hora_fin}` : ''}
                          </p>
                        )}
                        {ev.lugar && (
                          <p>
                            <strong>Lugar:</strong> {ev.lugar}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leyenda de categorías */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold uppercase text-slate-400">Leyenda</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TIPOS_EVENTO).map(([key, info]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-600"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${info.dot}`} />
                  <span>{info.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Programar / Editar Evento */}
      {modalAbierto && puedeGestionar && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {eventoEditando ? 'Editar Evento Académico' : 'Programar Evento Académico'}
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEvento} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Título del evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Entrega de libretas IV Bimestre"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Categoría
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {Object.entries(TIPOS_EVENTO).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Lugar (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Patio principal / Sala docente"
                    value={form.lugar}
                    onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Fecha inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.fecha_inicio}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fecha_inicio: e.target.value,
                        fecha_fin:
                          form.fecha_fin < e.target.value ? e.target.value : form.fecha_fin,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Fecha fin *
                  </label>
                  <input
                    type="date"
                    required
                    min={form.fecha_inicio}
                    value={form.fecha_fin}
                    onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Hora inicio (opcional)
                  </label>
                  <input
                    type="time"
                    value={form.hora_inicio}
                    onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Hora fin (opcional)
                  </label>
                  <input
                    type="time"
                    value={form.hora_fin}
                    onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Descripción / Detalles
                </label>
                <textarea
                  rows={3}
                  placeholder="Indicaciones para docentes, administrativos o familias..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : eventoEditando ? 'Actualizar Evento' : 'Programar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}