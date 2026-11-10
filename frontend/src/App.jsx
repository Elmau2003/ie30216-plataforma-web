// frontend/src/App.jsx
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import UsuariosPage from './pages/UsuariosPage';
import SalonesPage from './pages/SalonesPage';
import AsistenciaPage from './pages/AsistenciaPage';
import NotasPage from './pages/NotasPage';
import EstudiantePage from './pages/EstudiantePage';
import ComunicadosDirectivoPage from './pages/ComunicadosDirectivoPage';
import DocenteTramitesPage from './pages/DocenteTramitesPage';
import DirectivoSolicitudesPage from './pages/DirectivoSolicitudesPage';
import EstudianteComunicadosPage from './pages/EstudianteComunicadosPage';
import DocenteIncidenciasPage from './pages/DocenteIncidenciasPage';
import EstudianteIncidenciasPage from './pages/EstudianteIncidenciasPage';

function MainLayout() {
  const { usuario, logout, cargando } = useAuth();
  const [tabActiva, setTabActiva] = useState('dashboard');

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!usuario) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar rol={usuario.rol} tabActiva={tabActiva} setTabActiva={setTabActiva} />

      <div className="flex-1 flex flex-col">
        {/* Header superior */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-xs">
          <h1 className="text-lg font-bold text-slate-800">
            Intranet Institucional
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{usuario.nombres} {usuario.apellidos}</p>
              <p className="text-xs text-slate-500">{usuario.rol}</p>
            </div>
            <button
              onClick={logout}
              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg border border-red-200 font-medium transition"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Área de Contenido */}
        <main className="p-8 flex-1">
          {tabActiva === 'dashboard' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-2">¡Bienvenido(a), {usuario.nombres}!</h2>
              <p className="text-slate-600 text-sm">
                Selecciona una opción del menú lateral para comenzar a gestionar el sistema de la I.E. 30216.
              </p>
            </div>
          )}

          {/* Vistas Directivo / Administrativo / Docente */}
          {tabActiva === 'usuarios' && <UsuariosPage />}
          {tabActiva === 'salones' && <SalonesPage />}
          {tabActiva === 'asistencia' && <AsistenciaPage />}
          {tabActiva === 'notas' && <NotasPage />}
          {tabActiva === 'comunicados-directivo' && <ComunicadosDirectivoPage />}
          {tabActiva === 'solicitudes-directivo' && <DirectivoSolicitudesPage />}
          {tabActiva === 'tramites-docente' && <DocenteTramitesPage />}
          {tabActiva === 'incidencias-docente' && <DocenteIncidenciasPage />}

          {/* Vistas Estudiante separadas por la prop tabActiva */}
          {['boleta', 'asistencia_view', 'libreta'].includes(tabActiva) && (
            <EstudiantePage tabActiva={tabActiva} />
          )}

          {tabActiva === 'comunicados-estudiante' && <EstudianteComunicadosPage />}
          {tabActiva === 'incidencias-estudiante' && <EstudianteIncidenciasPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}