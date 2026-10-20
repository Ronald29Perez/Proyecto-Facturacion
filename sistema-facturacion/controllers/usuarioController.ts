// ============================================================================
// CONTROLADOR DE GESTIÓN DE USUARIOS
// Ubicación: controllers/usuarioController.ts
// BD: v3.0 — tabla 'usuarios' con columna 'rol' (texto)
// ============================================================================

import { supabase } from '../lib/supabase';
import { Usuario, RolUsuario } from '../models/agrolactec';

const ROLES_VALIDOS: RolUsuario[] = [
  'ADMINISTRADOR', 'GERENTE', 'BODEGA', 'CAJERO', 'VENDEDOR', 'CLIENTE',
];

// ============================================================================
// 1. LISTAR USUARIOS
// ============================================================================

export async function obtenerUsuarios(): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre_completo, username, rol, activo, created_at')
      .order('nombre_completo', { ascending: true });

    if (error) {
      console.error('Error al obtener usuarios:', error.message);
      return [];
    }

    return (data || []) as Usuario[];
  } catch (err) {
    console.error('Error de servidor en obtenerUsuarios:', err);
    return [];
  }
}

/**
 * Obtener usuarios filtrados por rol
 */
export async function obtenerUsuariosPorRol(rol: RolUsuario): Promise<Usuario[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre_completo, username, rol, activo')
      .eq('rol', rol)
      .eq('activo', true);

    if (error) {
      console.error('Error al obtener usuarios por rol:', error.message);
      return [];
    }
    return (data || []) as Usuario[];
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ============================================================================
// 2. CREAR USUARIO
// ============================================================================

export async function crearUsuario(datos: {
  nombre_completo: string;
  username: string;
  password: string;
  rol_nombre: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    // Validar rol
    const rolFormateado = (datos.rol_nombre || 'CLIENTE').toUpperCase().trim() as RolUsuario;
    if (!ROLES_VALIDOS.includes(rolFormateado)) {
      return { 
        success: false, 
        message: `❌ Rol inválido. Debe ser uno de: ${ROLES_VALIDOS.join(', ')}` 
      };
    }

    // Validar que username no exista ya
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('username', datos.username.toLowerCase().trim())
      .maybeSingle();

    if (existente) {
      return { success: false, message: '❌ El username ya está registrado.' };
    }

    // ⚠️ SEGURIDAD: en producción usa bcrypt aquí.
    // Por ahora se guarda en password_hash tal cual (placeholder para dev).
    const { error } = await supabase.from('usuarios').insert([
      {
        nombre_completo: datos.nombre_completo,
        username: datos.username.toLowerCase().trim(),
        password_hash: datos.password,   // 🔥 antes era 'password', ahora 'password_hash'
        rol: rolFormateado,
        activo: true,
      },
    ]);

    if (error) {
      console.error('Error al insertar usuario:', error.message);
      return { success: false, message: `Error al crear usuario: ${error.message}` };
    }

    return { success: true, message: '✅ Usuario registrado exitosamente.' };
  } catch (err: any) {
    console.error('Error inesperado al crear usuario:', err);
    return { success: false, message: `Error en el servidor: ${err.message}` };
  }
}

// ============================================================================
// 3. ACTUALIZAR / ESTADO
// ============================================================================

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
      message: `✅ Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`,
    };
  } catch (err) {
    return { success: false, message: 'Error al cambiar el estado del usuario.' };
  }
}

/**
 * Actualiza datos de un usuario existente
 */
export async function actualizarUsuario(
  id_usuario: string,
  cambios: Partial<Omit<Usuario, 'id_usuario' | 'password_hash'>>
): Promise<{ success: boolean; message: string }> {
  try {
    delete (cambios as any).id_usuario;
    delete (cambios as any).password_hash;

    const { error } = await supabase
      .from('usuarios')
      .update(cambios)
      .eq('id_usuario', id_usuario);

    if (error) throw error;

    return { success: true, message: '✅ Usuario actualizado correctamente.' };
  } catch (err: any) {
    console.error('Error al actualizar usuario:', err.message);
    return { success: false, message: `Error: ${err.message}` };
  }
}

/**
 * Cambiar la contraseña de un usuario
 */
export async function cambiarPassword(
  id_usuario: string,
  nuevaPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!nuevaPassword || nuevaPassword.length < 4) {
      return { success: false, message: '❌ La contraseña debe tener al menos 4 caracteres.' };
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ password_hash: nuevaPassword })  // ⚠️ usar bcrypt en prod
      .eq('id_usuario', id_usuario);

    if (error) throw error;

    return { success: true, message: '✅ Contraseña actualizada correctamente.' };
  } catch (err: any) {
    return { success: false, message: `Error: ${err.message}` };
  }
}