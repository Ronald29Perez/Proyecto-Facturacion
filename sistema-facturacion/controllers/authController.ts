// ============================================================================
// CONTROLADOR DE AUTENTICACIÓN
// Ubicación: controllers/authController.ts
// BD: v3.0 — tabla 'usuarios' con 'rol' y 'password_hash'
// ============================================================================

import { supabase } from '../lib/supabase';
import { Usuario, RolUsuario } from '../models/agrolactec';

export interface SesionUsuario {
  id_usuario: string;
  nombre_completo: string;
  username: string;
  rol: RolUsuario;
  activo: boolean;
}

/**
 * Inicia sesión con username + password.
 * Devuelve el usuario autenticado (sin password_hash) o null.
 */
export async function iniciarSesion(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; usuario?: SesionUsuario }> {
  try {
    const user = username.toLowerCase().trim();

    // 1. Buscar usuario por username
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre_completo, username, password_hash, rol, activo')
      .eq('username', user)
      .maybeSingle();

    if (error) {
      console.error('Error al autenticar:', error.message);
      return { success: false, message: 'Error al consultar el usuario.' };
    }

    if (!data) {
      return { success: false, message: '❌ Usuario o contraseña incorrectos.' };
    }

    if (!data.activo) {
      return { success: false, message: '❌ La cuenta está desactivada.' };
    }

    // 2. Verificar contraseña
    const passwordValida = await verificarPassword(password, data.password_hash);
    if (!passwordValida) {
      return { success: false, message: '❌ Usuario o contraseña incorrectos.' };
    }

    // 3. Devolver usuario SIN password_hash
    const sesion: SesionUsuario = {
      id_usuario: data.id_usuario,
      nombre_completo: data.nombre_completo,
      username: data.username,
      rol: data.rol as RolUsuario,
      activo: data.activo,
    };

    return {
      success: true,
      message: `✅ Bienvenido, ${data.nombre_completo}.`,
      usuario: sesion,
    };
  } catch (err: any) {
    console.error('Error de servidor en iniciarSesion:', err);
    return { success: false, message: 'Error inesperado al iniciar sesión.' };
  }
}

/**
 * Verifica la contraseña comparando con el hash.
 * Soporta bcrypt ($2a$...) y texto plano (dev).
 */
async function verificarPassword(plain: string, hash: string): Promise<boolean> {
  // Caso A: hash bcrypt
  if (hash && hash.startsWith('$2')) {
    try {
      // bcryptjs is an optional runtime dependency; keep this import optional for TypeScript.
      // @ts-ignore -- bcryptjs may not have installed type declarations.
      const bcrypt = await import('bcryptjs');
      return await bcrypt.compare(plain, hash);
    } catch (e) {
      console.warn('bcryptjs no instalado. Se comparará en texto plano.');
      return plain === hash;
    }
  }
  // Caso B: texto plano (dev)
  return plain === hash;
}

/**
 * Helper para el login del cliente final (sin tabla clientes aún)
 * Solo simula la sesión de un cliente genérico.
 */
export function iniciarSesionCliente(): SesionUsuario {
  return {
    id_usuario: '00000000-0000-0000-0000-000000000000',
    nombre_completo: 'Cliente Invitado',
    username: 'cliente',
    rol: 'CLIENTE',
    activo: true,
  };
}

/**
 * Guarda la sesión en localStorage
 */
export function guardarSesion(usuario: SesionUsuario) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('agrolactec_sesion', JSON.stringify(usuario));
  }
}

/**
 * Carga la sesión desde localStorage
 */
export function cargarSesion(): SesionUsuario | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('agrolactec_sesion');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Cierra sesión
 */
export function cerrarSesion() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('agrolactec_sesion');
  }
}

/**
 * Verifica si el usuario logueado tiene permiso de acceder a un rol específico
 */
export function tienePermiso(usuario: SesionUsuario | null, rolesPermitidos: RolUsuario[]): boolean {
  if (!usuario) return false;
  return rolesPermitidos.includes(usuario.rol);
}