// ============================================================================
// COMPONENTE FORMULARIO DE LOGIN (USERNAME)
// Ubicación: components/auth/LoginForm.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Usuario } from '../../models/agrolactec';
import { iniciarSesion } from '../../controllers/authController';

interface Props {
  onLoginExitoso: (usuario: Usuario) => void;
}

export default function LoginForm({ onLoginExitoso }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');

    if (!username.trim() || !password.trim()) {
      setErrorMensaje('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setCargando(true);
    const resultado = await iniciarSesion(username, password);
    setCargando(false);

    if (resultado.success && resultado.usuario) {
      onLoginExitoso(resultado.usuario);
    } else {
      setErrorMensaje(resultado.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '30px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>🧀 AgroLactec ERP</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Ingresa tu usuario y contraseña para acceder
          </p>
        </div>

        {errorMensaje && (
          <div
            style={{
              padding: '10px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            ⚠️ {errorMensaje}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
              Usuario (Username):
            </label>
            <input
              type="text"
              placeholder="Ej: admin_test"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
              Contraseña:
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
              marginTop: '8px',
            }}
          >
            {cargando ? 'Iniciando sesión...' : '🔒 Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}