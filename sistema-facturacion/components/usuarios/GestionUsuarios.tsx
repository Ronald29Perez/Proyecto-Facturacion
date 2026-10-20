// ============================================================================
// COMPONENTE: GESTIÓN DE USUARIOS Y ROLES
// Ubicación: components/usuarios/GestionUsuarios.tsx
// BD: v3.0 — u.rol es un STRING, no un objeto
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* ==================================================================== */}
      {/* FORMULARIO */}
      {/* ==================================================================== */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👤 Registrar Nuevo Usuario
        </h3>

        <form
          onSubmit={handleCrearUsuario}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div>
            <label style={labelStyle}>Nombre Completo *:</label>
            <input
              type="text"
              required
              placeholder="Ej: Juan Pérez"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Username (Nombre de Usuario) *:</label>
            <input
              type="text"
              required
              placeholder="Ej: cliente_test"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Contraseña *:</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Rol de Usuario *:</label>
            <select
              value={rolSeleccionado}
              onChange={(e) => setRolSeleccionado(e.target.value)}
              style={{ ...inputStyle, backgroundColor: '#ffffff', fontWeight: 'bold' }}
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
            style={{
              backgroundColor: guardando ? '#94a3b8' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: guardando ? 'not-allowed' : 'pointer',
              marginTop: '10px',
            }}
          >
            {guardando ? 'Guardando...' : '💾 Guardar Usuario'}
          </button>
        </form>
      </div>

      {/* ==================================================================== */}
      {/* TABLA */}
      {/* ==================================================================== */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👥 Usuarios en el Sistema
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.88rem',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid #e2e8f0',
                  color: '#475569',
                  backgroundColor: '#f8fafc',
                }}
              >
                <th style={{ padding: '10px' }}>Nombre</th>
                <th style={{ padding: '10px' }}>Username</th>
                <th style={{ padding: '10px' }}>Rol</th>
                <th style={{ padding: '10px' }}>Estado</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}
                  >
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const esActivo = u.activo !== false;
                  // ✅ FIX: u.rol es un string directo en la v3.0
                  const nombreRol = (u.rol || 'CLIENTE').toString();

                  return (
                    <tr key={u.id_usuario} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f172a' }}>
                        {u.nombre_completo}
                      </td>
                      <td style={{ padding: '10px', color: '#0284c7' }}>{u.username}</td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor:
                              nombreRol === 'ADMINISTRADOR'
                                ? '#e0f2fe'
                                : nombreRol === 'CLIENTE'
                                ? '#fef3c7'
                                : '#f1f5f9',
                            color:
                              nombreRol === 'ADMINISTRADOR'
                                ? '#0369a1'
                                : nombreRol === 'CLIENTE'
                                ? '#b45309'
                                : '#334155',
                          }}
                        >
                          {nombreRol.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            color: esActivo ? '#16a34a' : '#ef4444',
                            fontWeight: 'bold',
                          }}
                        >
                          {esActivo ? '🟢 Activo' : '🔴 Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(u.id_usuario, esActivo)}
                          style={{
                            backgroundColor: esActivo ? '#ef4444' : '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                          }}
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

// Estilos compartidos
const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 'bold',
  color: '#475569',
  display: 'block',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
};