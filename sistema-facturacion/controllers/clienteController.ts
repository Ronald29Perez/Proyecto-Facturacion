// ============================================================================
// CONTROLADOR DE CLIENTES B2B (DIRECTORIO COMERCIAL)
// Ubicación: controllers/clienteController.ts
// ============================================================================

import { supabase } from '../lib/supabase';

// Interfaz que mapea exactamente las columnas de la tabla clientes_b2b
export interface ClienteB2B {
  id_cliente?: string;       // Opcional al crear, generado por la BD (UUID)
  nombre_comercial: string;
  razon_social: string;
  nit: string;
  nrc: string;
  direccion: string;
  telefono: string;
  created_at?: string;       // Asignado automáticamente por la BD
}

/**
 * Obtiene la lista completa de clientes B2B registrados.
 */
export async function obtenerClientesB2B(): Promise<ClienteB2B[]> {
  try {
    const { data, error } = await supabase
      .from('clientes_b2b')
      .select('*')
      .order('nombre_comercial', { ascending: true });

    if (error) {
      console.error('Error al obtener clientes B2B:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error imprevisto al consultar clientes B2B:', err);
    return [];
  }
}

/**
 * Registra un nuevo cliente B2B en la tabla clientes_b2b.
 */
export async function crearClienteB2B(
  nuevoCliente: Omit<ClienteB2B, 'id_cliente' | 'created_at'>
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('clientes_b2b')
      .insert([nuevoCliente]);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Cliente B2B registrado exitosamente.' };
  } catch (err) {
    return { success: false, message: 'Error de conexión al registrar el cliente.' };
  }
}