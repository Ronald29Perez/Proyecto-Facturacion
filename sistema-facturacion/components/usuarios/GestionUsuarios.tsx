// ============================================================================
// COMPONENTE: GESTIÓN DE USUARIOS Y ROLES (RESPONSIVE)
// Ubicación: components/usuarios/GestionUsuarios.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Usuario, RolUsuario } from '../../models/agrolactec';
import { crearUsuario, cambiarEstadoUsuario } from '../../controllers/usuarioController';

interface Props {
  usuarios: Usuario[];
  onRefrescarUsuarios: () => Promise<void>;
}

export default function GestionUsuarios({ usuarios, onRefrescarUsuarios }: Props) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState<string>('CLIENTE');
  const [guardando, setGuardando] = useState(false);

  const ROLES_DISPONIBLES: { key: RolUsuario; label: string }[] = [
    { key: 'ADMINISTRADOR', label: 'ADMINISTRADOR' },
    { key: 'GERENTE', label: 'GERENTE' },
    { key: 'CAJERO', label: 'CAJERO' },
    { key: 'BODEGA', label: 'BODEGA' },
    { key: 'VENDEDOR', label: 'VENDEDOR' },
    { key: 'MOTORISTA', label: 'MOTORISTA (Rutas)' },
    { key: 'CLIENTE', label: 'CLIENTE' },
  ];

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreCompleto || !username || !password) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    setGuardando(true);
    const res = await crearUsuario({
      nombre_completo: nombreCompleto,
      username: username,
      password,
      rol_nombre: rolSeleccionado,
    });
    setGuardando(false);

    alert(res.message);

    if (res.success) {
      setNombreCompleto('');
      setUsername('');
      setPassword('');
      setRolSeleccionado('CLIENTE');
      await onRefrescarUsuarios();
    }
  };

  const handleToggleEstado = async (id_usuario: string, estadoActual: boolean) => {
    const accion = estadoActual ? 'desactivar' : 'reactivar';
    if (confirm(`¿Estás seguro de que deseas ${accion} a este usuario?`)) {
      const res = await cambiarEstadoUsuario(id_usuario, !estadoActual);
      alert(res.message);
      if (res.success) {
        await onRefrescarUsuarios();
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      
      {/* FORMULARIO (Ocupa 1/3 en PC) */}
      <div className="col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
        <h3 className="mt-0 mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
          👤 Registrar Nuevo Usuario
        </h3>

        <form onSubmit={handleCrearUsuario} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Juan Pérez"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Username *</label>
            <input
              type="text"
              required
              placeholder="Ej: cliente_test"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Contraseña *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Rol de Usuario *</label>
            <select
              value={rolSeleccionado}
              onChange={(e) => setRolSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-bold text-sm"
            >
              {ROLES_DISPONIBLES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className={`w-full py-2.5 mt-2 rounded-md font-bold text-white transition-colors ${
              guardando ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Usuario'}
          </button>
        </form>
      </div>

      {/* TABLA DE USUARIOS (Ocupa 2/3 en PC) */}
      <div className="col-span-1 lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="mt-0 mb-4 text-lg font-bold text-slate-800 flex items-center gap-2">
          👥 Usuarios en el Sistema
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Username</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-slate-400">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const esActivo = u.activo !== false;
                  const nombreRol = (u.rol || 'CLIENTE').toString();

                  // Definir colores del rol
                  let rolClasses = 'bg-slate-100 text-slate-700';
                  if (nombreRol === 'ADMINISTRADOR') rolClasses = 'bg-sky-100 text-sky-700';
                  else if (nombreRol === 'CLIENTE') rolClasses = 'bg-amber-100 text-amber-700';
                  else if (nombreRol === 'GERENTE') rolClasses = 'bg-purple-100 text-purple-700';
                  else if (nombreRol === 'CAJERO') rolClasses = 'bg-emerald-100 text-emerald-700';
                  else if (nombreRol === 'BODEGA') rolClasses = 'bg-orange-100 text-orange-700';

                  return (
                    <tr key={u.id_usuario} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-800">{u.nombre_completo}</td>
                      <td className="p-3 text-sky-600 font-medium">{u.username}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${rolClasses}`}>
                          {nombreRol.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-bold text-xs ${esActivo ? 'text-green-600' : 'text-red-600'}`}>
                          {esActivo ? '🟢 Activo' : '🔴 Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(u.id_usuario, esActivo)}
                          className={`px-3 py-1.5 rounded text-xs font-bold text-white transition-colors ${
                            esActivo ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {esActivo ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}