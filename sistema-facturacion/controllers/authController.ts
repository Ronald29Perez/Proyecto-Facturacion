// ============================================================================
// CONTROLADOR DE AUTENTICACIÓN CON DEPURACIÓN
// Ubicación: controllers/authController.ts
// ============================================================================

import { supabase } from '../lib/supabase';
import { Usuario } from '../models/agrolactec';

export async function iniciarSesion(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; usuario?: Usuario }> {
  try {
    const usernameLimpio = username.trim().toLowerCase();

    // 1. Consultar el usuario ignorando mayúsculas/minúsculas
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('username', usernameLimpio)
      .eq('activo', true)
      .maybeSingle();

    if (error) {
      console.error('Error de Supabase al consultar usuario:', error.message);
      return { success: false, message: `Error de BD: ${error.message}` };
    }

    if (!usuario) {
      return {
        success: false,
        message: 'Usuario no encontrado o cuenta inactiva.',
      };
    }

    // 2. Validar contraseña usando la función RPC
    const { data: esValido, error: errAuth } = await supabase.rpc('validar_password', {
      user_name: usernameLimpio,
      pass_plain: password,
    });

    if (errAuth) {
      console.error('Error en RPC validar_password:', errAuth.message);
    }

    if (!esValido) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }

    // 3. Estructurar el objeto de usuario y guardar sesión local
    const usuarioAutenticado: Usuario = {
      id_usuario: usuario.id_usuario,
      nombre_completo: usuario.nombre_completo,
      username: usuario.username,
      id_rol: usuario.rol,
      activo: usuario.activo,
      rol: {
        id_rol: usuario.rol,
        nombre_rol: usuario.rol,
        descripcion: `Rol de ${usuario.rol}`,
      },
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('agrolactec_usuario', JSON.stringify(usuarioAutenticado));
    }

    return {
      success: true,
      message: '✅ Inicio de sesión exitoso.',
      usuario: usuarioAutenticado,
    };
  } catch (err) {
    console.error('Error general en iniciarSesion:', err);
    return {
      success: false,
      message: 'Error al conectar con el servicio de autenticación.',
    };
  }
}

export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  try {
    if (typeof window === 'undefined') return null;

    const usuarioGuardado = localStorage.getItem('agrolactec_usuario');
    if (!usuarioGuardado) return null;

    return JSON.parse(usuarioGuardado) as Usuario;
  } catch (err) {
    console.error('Error al recuperar usuario actual:', err);
    return null;
  }
}

export async function cerrarSesion(): Promise<{ success: boolean; message: string }> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agrolactec_usuario');
    }
    return { success: true, message: 'Sesión cerrada correctamente.' };
  } catch (err) {
    return { success: false, message: 'Error al cerrar sesión.' };
  }
}

