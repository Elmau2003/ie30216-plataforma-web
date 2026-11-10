// frontend/src/components/Sidebar.jsx
export default function Sidebar({ rol, tabActiva, setTabActiva }) {
  const opcionesMenu = {
    DIRECTIVO: [
      { id: 'dashboard', nombre: 'Panel Principal' },
      { id: 'usuarios', nombre: 'Gestión de Usuarios' },
      { id: 'salones', nombre: 'Salones y Matrículas' },
      { id: 'comunicados-directivo', nombre: 'Comunicados Oficiales' },
      { id: 'solicitudes-directivo', nombre: 'Solicitudes Recibidas' },
    ],
    DOCENTE: [
      { id: 'dashboard', nombre: 'Panel Principal' },
      { id: 'asistencia', nombre: 'Registro de Asistencia' },
      { id: 'notas', nombre: 'Registro de Calificaciones' },
      { id: 'tramites-docente', nombre: 'Comunicados y Trámites' },
      { id: 'incidencias-docente', nombre: 'Registro de Incidencias' },
    ],
    ESTUDIANTE: [
      { id: 'dashboard', nombre: 'Panel Principal' },
      { id: 'comunicados-estudiante', nombre: 'Comunicados del Aula' },
      { id: 'boleta', nombre: 'Mis Calificaciones' },
      { id: 'asistencia_view', nombre: 'Mi Asistencia' },
      { id: 'incidencias-estudiante', nombre: 'Mis Incidencias' },
    ],
  };

  const opciones = opcionesMenu[rol] || [];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-white tracking-wide">I.E. 30216</h1>
          <p className="text-xs text-slate-400">Sagrado Corazón de María</p>
        </div>

        <nav className="space-y-1">
          {opciones.map((op) => (
            <button
              key={op.id}
              onClick={() => setTabActiva(op.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
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
  );
}