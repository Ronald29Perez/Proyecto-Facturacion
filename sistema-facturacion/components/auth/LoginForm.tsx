// ============================================================================
// COMPONENTE: FORMULARIO DE LOGIN
// Ubicación: components/auth/LoginForm.tsx
// Flujo: hace login → llama a onLoginExitoso → el padre decide qué mostrar
// ============================================================================

'use client';

import { useState } from 'react';
import { iniciarSesion, SesionUsuario } from '../../controllers/authController';

interface Props {
  onLoginExitoso: (usuario: SesionUsuario) => void | Promise<void>;
}

export default function LoginForm({ onLoginExitoso }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    const resultado = await iniciarSesion(username, password);

    if (resultado.success && resultado.usuario) {
      // El padre (app/page.tsx) se encarga de guardar y navegar
      await onLoginExitoso(resultado.usuario);
    } else {
      setError(resultado.message);
    }

    setCargando(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px',
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          backgroundColor: '#ffffff',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* LOGO / TÍTULO */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '1.8rem',
              color: '#0284c7',
            }}
          >
            🧀 AgroLactec
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '0.85rem',
              color: '#64748b',
            }}
          >
            Sistema de Pedidos e Inventario
          </p>
        </div>

        {/* USERNAME */}
        <div>
          <label style={labelStyle}>Usuario</label>
          <input
            type="text"
            placeholder="Ej: admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={inputStyle}
          />
        </div>

        {/* PASSWORD */}
        <div>
          <label style={labelStyle}>Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={inputStyle}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={cargando}
          style={{
            backgroundColor: cargando ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: cargando ? 'not-allowed' : 'pointer',
            marginTop: '8px',
          }}
        >
          {cargando ? 'Ingresando...' : '🔐 Iniciar Sesión'}
        </button>

        {/* PISTA DE USUARIOS DE PRUEBA */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.75rem',
            color: '#94a3b8',
            textAlign: 'center',
          }}
        >
          <strong>Usuarios de prueba:</strong>
          <br />
          admin / admin123 · bodega1 / bod123 · cliente_test / cli123
        </div>
      </form>
    </div>
  );
}

// Estilos compartidos
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  color: '#475569',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '0.95rem',
  outline: 'none',
};