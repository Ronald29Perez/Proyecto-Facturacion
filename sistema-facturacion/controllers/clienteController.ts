// ============================================================================
// CONTROLADOR DE CLIENTES (B2C + B2B unificado)
// Ubicación: controllers/clienteController.ts
// BD: v3.0 — tabla 'clientes' con campo 'tipo'
// ============================================================================

import { supabase } from '../lib/supabase';
import { ClienteEntity, ClienteTipo } from '../models/agrolactec';

// ============================================================================
// 1. LISTAR CLIENTES
// ============================================================================

/**
 * Obtiene todos los clientes activos (B2C + B2B)
 */
export async function obtenerClientes(): Promise<ClienteEntity[]> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener clientes:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error imprevisto:', err);
    return [];
  }
}

/**
 * Solo clientes B2B (para el directorio comercial)
 */
export async function obtenerClientesB2B(): Promise<ClienteEntity[]> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('tipo', 'B2B_COMERCIO')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener clientes B2B:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error imprevisto:', err);
    return [];
  }
}

/**
 * Solo clientes B2C (para el listado de hogar)
 */
export async function obtenerClientesB2C(): Promise<ClienteEntity[]> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('tipo', 'B2C_HOGAR')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener clientes B2C:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error imprevisto:', err);
    return [];
  }
}

// ============================================================================
// 2. BÚSQUEDA (para el checkout del cliente)
// ============================================================================

/**
 * Busca un cliente por término y tipo.
 * - B2B: busca por NIT, NRC o nombre
 * - B2C: busca por teléfono, email o nombre
 */
export async function buscarCliente(
  termino: string,
  tipo: ClienteTipo
): Promise<ClienteEntity[]> {
  try {
    if (!termino || termino.trim().length < 2) return [];

    let query = supabase
      .from('clientes')
      .select('*')
      .eq('tipo', tipo)
      .eq('activo', true);

    if (tipo === 'B2B_COMERCIO') {
      query = query.or(
        `nit.ilike.%${termino}%,nrc.ilike.%${termino}%,nombre.ilike.%${termino}%`
      );
    } else {
      query = query.or(
        `telefono.ilike.%${termino}%,email.ilike.%${termino}%,nombre.ilike.%${termino}%`
      );
    }

    const { data, error } = await query.limit(10);

    if (error) {
      console.error('Error al buscar cliente:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error imprevisto en búsqueda:', err);
    return [];
  }
}

/**
 * Busca un cliente exacto por NIT o NRC (para el autocompletado del checkout B2B)
 */
export async function buscarClientePorNitONrc(nitOrNrc: string): Promise<ClienteEntity | null> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nit.eq.${nitOrNrc},nrc.eq.${nitOrNrc}`)
      .maybeSingle();

    if (error) {
      console.error('Error al buscar por NIT/NRC:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error imprevisto:', err);
    return null;
  }
}

// ============================================================================
// 3. CREAR / ACTUALIZAR
// ============================================================================

/**
 * Crea un cliente nuevo (B2C o B2B).
 * - B2B: exige NIT y NRC
 * - B2C: solo nombre y teléfono
 */
export async function crearCliente(
  nuevoCliente: Omit<ClienteEntity, 'id_cliente' | 'created_at' | 'activo'> & { activo?: boolean }
): Promise<{ success: boolean; message: string; cliente?: ClienteEntity }> {
  try {
    // Validaciones según tipo
    if (nuevoCliente.tipo === 'B2B_COMERCIO') {
      if (!nuevoCliente.nit || !nuevoCliente.nrc) {
        return { success: false, message: '❌ NIT y NRC son obligatorios para clientes B2B.' };
      }
      if (!nuevoCliente.razon_social) {
        return { success: false, message: '❌ Razón Social es obligatoria para clientes B2B.' };
      }
    } else {
      // B2C: nombre y teléfono obligatorios
      if (!nuevoCliente.nombre || !nuevoCliente.telefono) {
        return { success: false, message: '❌ Nombre y teléfono son obligatorios.' };
      }
    }

    // Validación general
    if (!nuevoCliente.nombre || !nuevoCliente.telefono) {
      return { success: false, message: '❌ Nombre y teléfono son obligatorios.' };
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        ...nuevoCliente,
        activo: nuevoCliente.activo !== undefined ? nuevoCliente.activo : true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error al crear cliente:', error.message);
      return { success: false, message: `Error en BD: ${error.message}` };
    }

    return {
      success: true,
      message: '✅ Cliente registrado exitosamente.',
      cliente: data,
    };
  } catch (err: any) {
    console.error('Error de servidor al crear cliente:', err);
    return { success: false, message: 'Error de conexión al registrar el cliente.' };
  }
}

/**
 * Alias para compatibilidad con código existente
 */
export const crearClienteB2B = crearCliente;

/**
 * Actualiza un cliente existente
 */
export async function actualizarCliente(
  id_cliente: string,
  cambios: Partial<ClienteEntity>
): Promise<{ success: boolean; message: string }> {
  try {
    // No permitir cambiar el id ni created_at
    delete cambios.id_cliente;
    delete cambios.created_at;

    const { error } = await supabase
      .from('clientes')
      .update(cambios)
      .eq('id_cliente', id_cliente);

    if (error) throw error;

    return { success: true, message: '✅ Cliente actualizado correctamente.' };
  } catch (err: any) {
    console.error('Error al actualizar cliente:', err.message);
    return { success: false, message: `Error: ${err.message}` };
  }
}

/**
 * Activa / Desactiva un cliente
 */
export async function cambiarEstadoCliente(
  id_cliente: string,
  activo: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('clientes')
      .update({ activo })
      .eq('id_cliente', id_cliente);

    if (error) throw error;

    return {
      success: true,
      message: `✅ Cliente ${activo ? 'activado' : 'desactivado'} correctamente.`,
    };
  } catch (err: any) {
    return { success: false, message: `Error: ${err.message}` };
  }
}

/**
 * Obtiene un cliente por su ID
 */
export async function obtenerClientePorId(id_cliente: string): Promise<ClienteEntity | null> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id_cliente', id_cliente)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener cliente:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error imprevisto:', err);
    return null;
  }
}