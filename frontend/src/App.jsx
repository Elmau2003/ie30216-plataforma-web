// frontend/src/App.jsx
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

function MainContent() {
  const { usuario, logout, cargando } = useAuth();

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!usuario) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header básico */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="font-bold text-slate-800">I.E. 30216 Sagrado Corazón de María</h2>
          <p className="text-xs text-slate-500">Bienvenido(a), {usuario.nombres} {usuario.apellidos}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200">
            {usuario.rol}
          </span>
          <button
            onClick={logout}
            className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 font-medium transition"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Panel de Bienvenida */}
      <main className="p-6 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Panel Principal</h3>
          <p className="text-slate-600 text-sm">
            Has ingresado con éxito al sistema. Tu rol asignado es: <strong className="text-blue-600">{usuario.rol}</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}