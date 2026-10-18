// ============================================================================
// CONTROLADOR DE GESTIÓN DE USUARIOS
// Ubicación: controllers/usuarioController.ts
// ============================================================================

import { supabase } from '../lib/supabase';
import { Usuario } from '../models/agrolactec';

/**
 * Obtiene la lista completa de usuarios registrados en el ERP
 */
export async function obtenerUsuarios(): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre_completo', { ascending: true });

    if (error) {
      console.error('Error al obtener usuarios:', error.message);
      return [];
    }

    return (data || []).map((usr: any) => ({
      id_usuario: usr.id_usuario,
      nombre_completo: usr.nombre_completo,
      username: usr.username,
      id_rol: usr.rol,
      activo: usr.activo,
      rol: {
        id_rol: usr.rol,
        nombre_rol: usr.rol,
        descripcion: `Rol de ${usr.rol}`,
      },
    }));
  } catch (err) {
    console.error('Error de servidor en obtenerUsuarios:', err);
    return [];
  }
}

/**
 * Registra un nuevo usuario cifrando su contraseña con bcrypt en PostgreSQL
 */
export async function crearUsuario(datos: {
  nombre_completo: string;
  username: string;
  password: string;
  rol_nombre: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    // Normalizar el rol a mayúsculas para mantener consistencia
    const rolFormateado = (datos.rol_nombre || 'CLIENTE').toUpperCase().trim();

    const { error } = await supabase.from('usuarios').insert([
      {
        id_usuario: crypto.randomUUID(),
        nombre_completo: datos.nombre_completo,
        username: datos.username.toLowerCase().trim(),
        password: datos.password,
        rol: rolFormateado,
        activo: true,
      },
    ]);

    if (error) {
      console.error('Error al insertar usuario en Supabase:', error.message);
      return { success: false, message: `Error al crear usuario: ${error.message}` };
    }

    return { success: true, message: '✅ Usuario registrado exitosamente.' };
  } catch (err: any) {
    console.error('Error inesperado al crear usuario:', err);
    return { success: false, message: `Error en el servidor: ${err.message}` };
  }
}
/**
 * Activa o desactiva la cuenta de un usuario
 */
export async function cambiarEstadoUsuario(
  id_usuario: string,
  nuevoEstado: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: nuevoEstado })
      .eq('id_usuario', id_usuario);

    if (error) {
      return { success: false, message: `Error al cambiar estado: ${error.message}` };
    }

    return {
      success: true,
      message: `✅ Estado del usuario actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}.`,
    };
  } catch (err) {
    return { success: false, message: 'Error al cambiar el estado del usuario.' };
  }
}