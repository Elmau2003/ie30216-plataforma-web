// frontend/src/pages/UsuariosPage.jsx
import { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Formulario Registro
  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [rolNombre, setRolNombre] = useState('DOCENTE');
  const [creando, setCreando] = useState(false);

  // Estado para Edición (Modal)
  const [usuarioEditar, setUsuarioEditar] = useState(null);

  const cargarUsuarios = async () => {
    try {
      const data = await fetchAPI('/users');
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setError('');
    setCreando(true);

    try {
      await fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify({ dni, nombres, apellidos, correo, password, rolNombre }),
      });
      setDni(''); setNombres(''); setApellidos(''); setCorreo(''); setPassword('');
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await fetchAPI(`/users/${usuarioEditar.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombres: usuarioEditar.nombres,
          apellidos: usuarioEditar.apellidos,
          correo: usuarioEditar.correo,
          rolNombre: usuarioEditar.rol,
        }),
      });
      setUsuarioEditar(null);
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminarUsuario = async (id, dniNombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${dniNombre}?`)) return;
    setError('');

    try {
      await fetchAPI(`/users/${id}`, { method: 'DELETE' });
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleEstado = async (id, estadoActual) => {
    try {
      await fetchAPI(`/users/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !estadoActual }),
      });
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Gestión de Usuarios</h2>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {/* Formulario de Registro */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-md font-semibold text-slate-700 mb-4">Registrar Nuevo Usuario</h3>
        <form onSubmit={handleCrearUsuario} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">DNI (Usuario)</label>
            <input type="text" maxLength={8} value={dni} onChange={(e) => setDni(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombres</label>
            <input type="text" value={nombres} onChange={(e) => setNombres(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Apellidos</label>
            <input type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Correo Electrónico</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Rol de Usuario</label>
            <select value={rolNombre} onChange={(e) => setRolNombre(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="DOCENTE">DOCENTE</option>
              <option value="ESTUDIANTE">ESTUDIANTE</option>
              <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
              <option value="DIRECTIVO">DIRECTIVO</option>
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" disabled={creando} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg text-sm shadow">
              {creando ? 'Guardando...' : 'Registrar Usuario'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">DNI</th>
              <th className="p-4">Nombres y Apellidos</th>
              <th className="p-4">Correo</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-400">Cargando usuarios...</td></tr>
            ) : usuarios.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono">{user.dni}</td>
                <td className="p-4 font-medium text-slate-800">{user.nombres} {user.apellidos}</td>
                <td className="p-4 text-slate-500">{user.correo || '-'}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    user.rol === 'DIRECTIVO' ? 'bg-purple-100 text-purple-800' :
                    user.rol === 'DOCENTE' ? 'bg-blue-100 text-blue-800' :
                    user.rol === 'ESTUDIANTE' ? 'bg-green-100 text-green-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {user.rol}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleEstado(user.id, user.activo)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      user.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="p-4 text-center space-x-2">
                  <button
                    onClick={() => setUsuarioEditar(user)}
                    className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-md text-xs font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminarUsuario(user.id, `${user.nombres} (${user.dni})`)}
                    className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-md text-xs font-medium"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {usuarioEditar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Editar Usuario ({usuarioEditar.dni})</h3>
            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombres</label>
                <input
                  type="text"
                  value={usuarioEditar.nombres}
                  onChange={(e) => setUsuarioEditar({ ...usuarioEditar, nombres: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Apellidos</label>
                <input
                  type="text"
                  value={usuarioEditar.apellidos}
                  onChange={(e) => setUsuarioEditar({ ...usuarioEditar, apellidos: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={usuarioEditar.correo || ''}
                  onChange={(e) => setUsuarioEditar({ ...usuarioEditar, correo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rol</label>
                <select
                  value={usuarioEditar.rol}
                  onChange={(e) => setUsuarioEditar({ ...usuarioEditar, rol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="DOCENTE">DOCENTE</option>
                  <option value="ESTUDIANTE">ESTUDIANTE</option>
                  <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                  <option value="DIRECTIVO">DIRECTIVO</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUsuarioEditar(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}