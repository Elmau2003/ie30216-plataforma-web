// frontend/src/components/Sidebar.jsx
export default function Sidebar({
  rol,
  tabActiva,
  setTabActiva,
  abiertoMovil = false,
  setAbiertoMovil = () => {},
}) {
  const opcionesMenu = {
    DIRECTIVO: [
      { id: 'dashboard', nombre: 'Panel Principal' },
      { id: 'usuarios', nombre: 'Gestión de Usuarios' },
      { id: 'salones', nombre: 'Salones y Matrículas' },
      { id: 'comunicados-directivo', nombre: 'Comunicados Oficiales' },
      { id: 'solicitudes-directivo', nombre: 'Solicitudes Recibidas' },
      { id: 'calendario-academico', nombre: 'Calendario Académico' },
    ],
    DOCENTE: [
      { id: 'dashboard', nombre: 'Panel Principal' },
      { id: 'asistencia', nombre: 'Registro de Asistencia' },
      { id: 'notas', nombre: 'Registro de Calificaciones' },
      { id: 'tramites-docente', nombre: 'Comunicados y Trámites' },
      { id: 'incidencias-docente', nombre: 'Registro de Incidencias' },
      { id: 'calendario-academico', nombre: 'Calendario Académico' },
    ],
    ESTUDIANTE: [
      { id: 'dashboard', nombre: 'Panel Principal' },
      { id: 'comunicados-estudiante', nombre: 'Comunicados del Aula' },
      { id: 'boleta', nombre: 'Mis Calificaciones' },
      { id: 'asistencia_view', nombre: 'Mi Asistencia' },
      { id: 'incidencias-estudiante', nombre: 'Mis Incidencias' },
    ],
    ADMINISTRATIVO: [
      { id: 'dashboard', nombre: 'Panel Principal' },
      { id: 'mesa-partes', nombre: 'Mesa de Partes (Externos)' },
      { id: 'consultas-admin', nombre: 'Consultas Generales' },
      { id: 'calendario-academico', nombre: 'Calendario Académico' },
    ],
  };

  const rolNormalizado = String(rol || '').toUpperCase();
  const opciones = opcionesMenu[rolNormalizado] || [];

  const seleccionarOpcion = (id) => {
    setTabActiva(id);
    setAbiertoMovil(false);
  };

  return (
    <>
      {abiertoMovil && (
        <div
          onClick={() => setAbiertoMovil(false)}
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between transition-transform duration-200 ease-out ${
          abiertoMovil ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="min-w-0">
          <div className="mb-8 px-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/images/institucion/logo.png"
                alt="Insignia I.E. 30216"
                className="w-11 h-11 object-contain shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white tracking-wide leading-tight truncate">
                  I.E. 30216
                </h1>
                <p className="text-xs text-slate-400 leading-snug truncate">
                  Sagrado Corazón de María
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAbiertoMovil(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-1">
            {opciones.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => seleccionarOpcion(op.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  tabActiva === op.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                {op.nombre}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-2 py-4 border-t border-slate-800 text-xs text-slate-500">
          Plataforma Web Academic v1.0
        </div>
      </aside>
    </>
  );
}