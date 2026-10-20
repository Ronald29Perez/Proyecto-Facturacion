// ============================================================================
// CONTROLADOR DE COTIZACIONES Y RECEPCIÓN DESDE EL CARRITO LOCAL
// Ubicación: controllers/cotizacionController.ts
// BD: v3.0 (clientes unificados)
// ============================================================================

import { supabase } from '../lib/supabase';
import { ResumenCarrito, CotizacionEntity } from '../models/agrolactec';

/**
 * Guarda en Supabase la cotización confirmada desde la memoria local del carrito
 */
export async function crearCotizacionDesdeCarrito(
  carrito: ResumenCarrito,
  clienteNombre: string,
  clienteTipo: 'B2B_COMERCIO' | 'B2C_HOGAR',
  idCliente?: string // 🔗 Cambiado: antes era idClienteB2B
): Promise<{ success: boolean; message: string; numero_cotizacion?: string }> {
  try {
    if (carrito.items.length === 0) {
      return { success: false, message: 'El carrito de compras está vacío.' };
    }

    const numeroCotizacion = `COT-${Date.now().toString().slice(-6)}`;

    // 1. Insertar el encabezado de la cotización
    const { data: cotizacionCreada, error: errorEncabezado } = await supabase
      .from('cotizaciones')
      .insert([
        {
          numero_cotizacion: numeroCotizacion,
          cliente_tipo: clienteTipo,
          cliente_nombre: clienteNombre,
          id_cliente: idCliente || null, // 🔗 Cambiado: antes era id_cliente_b2b
          subtotal: carrito.subtotal,
          impuesto_iva: carrito.impuesto_iva,
          total: carrito.total,
          estado: 'PENDIENTE',
        },
      ])
      .select()
      .single();

    if (errorEncabezado || !cotizacionCreada) {
      return { success: false, message: `Error al crear cotización: ${errorEncabezado?.message}` };
    }

    // 2. Insertar los ítems del detalle
    const detallesData = carrito.items.map((item) => ({
      id_cotizacion: cotizacionCreada.id_cotizacion,
      id_producto: item.producto.id_producto,
      nombre_producto: item.producto.nombre, // item.producto.nombre viene del modelo nuevo
      unidad_medida: item.unidad_medida,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal_item: item.subtotal,
    }));

    const { error: errorDetalles } = await supabase.from('cotizacion_detalles').insert(detallesData);

    if (errorDetalles) {
      return { success: false, message: `Error al insertar detalles de cotización: ${errorDetalles.message}` };
    }

    return {
      success: true,
      numero_cotizacion: numeroCotizacion,
      message: `✅ Cotización ${numeroCotizacion} enviada con éxito a Bodega.`,
    };
  } catch (err) {
    return { success: false, message: 'Error de servidor al guardar la cotización.' };
  }
}

/**
 * Obtiene todas las cotizaciones pendientes de despachar por Bodega
 * Incluye datos del cliente (para mostrar NIT/NRC cuando sea B2B)
 */
export async function obtenerCotizacionesPendientes(): Promise<CotizacionEntity[]> {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cotizacion_detalles (*),
        clientes (nombre, nit, nrc, telefono, razon_social)
      `)
      .eq('estado', 'PENDIENTE')
      .order('fecha_emision', { ascending: false });

    if (error) {
      console.error('Error al consultar cotizaciones pendientes:', error.message);
      return [];
    }

    return (data || []).map((c: any) => ({
      ...c,
      detalles: c.cotizacion_detalles || [],
      // adjuntamos el cliente al objeto para facilidad en el frontend
      clientes: c.clientes || null,
    }));
  } catch (err) {
    console.error('Error imprevisto en obtenerCotizacionesPendientes:', err);
    return [];
  }
}