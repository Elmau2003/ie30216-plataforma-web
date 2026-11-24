// frontend/src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchAPI } from './services/api';
import LandingPage from './pages/LandingPage';
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
import AdminMesaPartesPage from './pages/AdminMesaPartesPage';
import AdminConsultasPage from './pages/AdminConsultasPage';

const TITULO_LANDING = 'I.E. N.° 30216 "Sagrado Corazón de María"';
const TITULO_INTRANET = 'Intranet';

const TABS_POR_ROL = {
  DIRECTIVO: [
    'dashboard',
    'usuarios',
    'salones',
    'comunicados-directivo',
    'solicitudes-directivo',
  ],
  ADMINISTRATIVO: [
    'dashboard',
    'mesa-partes',
    'consultas-admin',
  ],
  DOCENTE: [
    'dashboard',
    'asistencia',
    'notas',
    'tramites-docente',
    'incidencias-docente',
  ],
  ESTUDIANTE: [
    'dashboard',
    'comunicados-estudiante',
    'boleta',
    'asistencia_view',
    'libreta',
    'incidencias-estudiante',
  ],
};

function esRutaIntranet(hash) {
  return String(hash || '').startsWith('#/intranet');
}

function ModalCambioPasswordObligatorio({ onCompletado, onLogout }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (nuevaPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (nuevaPassword === passwordActual) {
      setError('La nueva contraseña debe ser diferente a la clave temporal.');
      return;
    }

    setGuardando(true);
    try {
      await fetchAPI('/auth/cambiar-password', {
        method: 'POST',
        body: JSON.stringify({ passwordActual, nuevaPassword }),
      });
      onCompletado();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            Seguridad de Cuenta
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-2">
            Debes cambiar tu contraseña
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Por seguridad, debes establecer una contraseña personal antes de continuar usando la plataforma.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Contraseña actual / temporal
            </label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nueva contraseña (mín. 6 caracteres)
            </label>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-red-600 font-medium"
            >
              Cerrar sesión
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar nueva clave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MainLayout() {
  const { usuario, logout, cargando } = useAuth();
  const [tabActiva, setTabActiva] = useState('dashboard');
  const [enIntranet, setEnIntranet] = useState(() => esRutaIntranet(window.location.hash));

  const estaEnLanding = !usuario && !enIntranet;

  useEffect(() => {
    document.title = estaEnLanding ? TITULO_LANDING : TITULO_INTRANET;
  }, [estaEnLanding]);

  useEffect(() => {
    const manejarCambioHash = () => {
      setEnIntranet(esRutaIntranet(window.location.hash));
    };

    window.addEventListener('hashchange', manejarCambioHash);
    return () => window.removeEventListener('hashchange', manejarCambioHash);
  }, []);

  // Mantener el hash sincronizado cuando hay sesión activa
  useEffect(() => {
    if (usuario && !esRutaIntranet(window.location.hash)) {
      window.location.hash = '#/intranet';
    }
  }, [usuario]);

  // Siempre ir al panel principal al iniciar sesión, cambiar de usuario/rol o refrescar la página
  useEffect(() => {
    setTabActiva('dashboard');
  }, [usuario?.id, usuario?.rol]);

  const irAIntranet = useCallback(() => {
    window.location.hash = '#/intranet';
    setEnIntranet(true);
  }, []);

  const irAInicio = useCallback(() => {
    window.location.hash = '#/';
    setEnIntranet(false);
  }, []);

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  // Si no hay sesión y no está en #/intranet, mostrar el landing institucional
  if (!usuario && !enIntranet) {
    return <LandingPage onAccederIntranet={irAIntranet} />;
  }

  // Si está en #/intranet pero sin sesión iniciada, mostrar Login
  if (!usuario) {
    return <Login onVolverInicio={irAInicio} />;
  }

  const handleCerrarSesion = () => {
    logout();
    irAInicio();
  };

  const rolActual = String(usuario.rol || '').toUpperCase();
  const tabsPermitidos = TABS_POR_ROL[rolActual] || ['dashboard'];
  const tabSegura = tabsPermitidos.includes(tabActiva) ? tabActiva : 'dashboard';

  const handleCambioCompletado = () => {
    try {
      const guardado = localStorage.getItem('usuario');
      if (guardado) {
        const parsed = JSON.parse(guardado);
        parsed.debe_cambiar_password = false;
        localStorage.setItem('usuario', JSON.stringify(parsed));
      }
    } catch (_) {
      // Ignorar si no se usa esa clave en localStorage
    }
    window.location.hash = '#/intranet';
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar rol={usuario.rol} tabActiva={tabSegura} setTabActiva={setTabActiva} />

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
              onClick={handleCerrarSesion}
              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg border border-red-200 font-medium transition"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Área de Contenido */}
        <main className="p-8 flex-1">
          {tabSegura === 'dashboard' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-2">¡Bienvenido(a), {usuario.nombres}!</h2>
              <p className="text-slate-600 text-sm">
                Selecciona una opción del menú lateral para comenzar a gestionar el sistema de la I.E. 30216.
              </p>
            </div>
          )}

          {/* Vistas Directivo / Docente */}
          {tabSegura === 'usuarios' && <UsuariosPage />}
          {tabSegura === 'salones' && <SalonesPage />}
          {tabSegura === 'asistencia' && <AsistenciaPage />}
          {tabSegura === 'notas' && <NotasPage />}
          {tabSegura === 'comunicados-directivo' && <ComunicadosDirectivoPage />}
          {tabSegura === 'solicitudes-directivo' && <DirectivoSolicitudesPage />}
          {tabSegura === 'tramites-docente' && <DocenteTramitesPage />}
          {tabSegura === 'incidencias-docente' && <DocenteIncidenciasPage />}

          {/* Vistas Administrativo (Mesa de Partes y Consultas Generales) */}
          {tabSegura === 'mesa-partes' && <AdminMesaPartesPage />}
          {tabSegura === 'consultas-admin' && <AdminConsultasPage />}

          {/* Vistas Estudiante separadas por la prop tabActiva */}
          {['boleta', 'asistencia_view', 'libreta'].includes(tabSegura) && (
            <EstudiantePage tabActiva={tabSegura} />
          )}

          {tabSegura === 'comunicados-estudiante' && <EstudianteComunicadosPage />}
          {tabSegura === 'incidencias-estudiante' && <EstudianteIncidenciasPage />}
        </main>
      </div>

      {usuario.debe_cambiar_password && (
        <ModalCambioPasswordObligatorio
          onLogout={handleCerrarSesion}
          onCompletado={handleCambioCompletado}
        />
      )}
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