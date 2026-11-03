// ============================================================================
// COMPONENTE: FORMULARIO DE LOGIN
// Ubicación: components/auth/LoginForm.tsx
// ============================================================================

'use client';

import { useState } from 'react';
import { iniciarSesion, SesionUsuario } from '../../controllers/authController';
import Image from 'next/image';
import { Lock, Loader2 } from 'lucide-react';

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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <Image 
              src="/img/logo-agrolactec.png" 
              alt="AgroLactec Logo" 
              width={220} 
              height={80} 
              style={{ objectFit: 'contain' }} 
            />
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
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
            display: 'flex',           // 🔥 Alinea el icono y el texto
            alignItems: 'center',      // 🔥 Alinea el icono y el texto
            justifyContent: 'center',  // 🔥 Centra todo
            gap: '8px',                // 🔥 Espacio entre el icono y el texto
            transition: 'background-color 0.2s'
          }}
        >
          {cargando ? (
            <>
              <Loader2 size={20} className="animate-spin" /> {/* Icono de carga girando */}
              Ingresando...
            </>
          ) : (
            <>
              <Lock size={20} />
              Iniciar Sesión
            </>
          )}
        </button>
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