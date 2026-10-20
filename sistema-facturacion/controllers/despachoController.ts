// ============================================================================
// CONTROLADOR DE BODEGA, LOTES Y DESPACHO FIFO
// Ubicación: controllers/despachoController.ts
// BD: v3.0 — usa la función RPC procesar_despacho_fifo
// ============================================================================

import { supabase } from '../lib/supabase';
import { LoteEntity, OrdenDespachoEntity } from '../models/agrolactec';

/**
 * 1. Obtiene la lista de lotes ordenados por fecha de vencimiento (FIFO)
 * Solo trae lotes con stock > 0.
 */
export async function obtenerLotesOrdenadosFIFO(): Promise<LoteEntity[]> {
  try {
    const { data, error } = await supabase
      .from('lotes')
      .select(`
        *,
        productos (
          id_producto,
          item_code,
          nombre,
          unidades_por_caja,
          precio_b2c,
          precio_b2b
        )
      `)
      .gt('cantidad_disponible', 0)  // 🔥 cambio: antes era unidades_disponibles
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      console.error('Error al consultar lotes FIFO:', error.message);
      return [];
    }

    // Mapeamos al modelo LoteEntity + estado calculado
    const lotesFormateados: LoteEntity[] = (data || []).map((item: any) => {
      // Calcular estado de vencimiento dinámicamente
      const hoy = new Date();
      const vence = new Date(item.fecha_vencimiento);
      const diasRestantes = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      let estado: 'NORMAL' | 'POR_VENCER' | 'VENCIDO' = 'NORMAL';
      if (diasRestantes < 0) estado = 'VENCIDO';
      else if (diasRestantes <= 7) estado = 'POR_VENCER';

      return {
        id_lote: item.id_lote,
        id_producto: item.id_producto,
        codigo_lote: item.codigo_lote,
        fecha_ingreso: item.fecha_ingreso,
        fecha_vencimiento: item.fecha_vencimiento,
        cantidad_disponible: item.cantidad_disponible,
        created_at: item.created_at,
        estado_vencimiento: estado,
        productos: item.productos || undefined,
      };
    });

    return lotesFormateados;
  } catch (err) {
    console.error('Error de servidor en obtenerLotesOrdenadosFIFO:', err);
    return [];
  }
}

/**
 * 2. Registra una nueva entrada de lote a bodega
 */
export async function registrarNuevoLote(nuevoLote: {
  id_producto: string;
  codigo_lote: string;
  fecha_vencimiento: string;
  cantidad_disponible: number;   // 🔥 cambio: antes era cajas_ingresadas
}): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('lotes').insert([
      {
        id_producto: nuevoLote.id_producto,
        codigo_lote: nuevoLote.codigo_lote,
        fecha_vencimiento: nuevoLote.fecha_vencimiento,
        cantidad_disponible: nuevoLote.cantidad_disponible,
        // fecha_ingreso se pone por default CURRENT_DATE en la BD
      },
    ]);

    if (error) {
      console.error('Error al registrar lote:', error.message);
      return { success: false, message: `Error en la base de datos: ${error.message}` };
    }

    return { success: true, message: '✅ Lote de inventario registrado con éxito.' };
  } catch (err) {
    console.error('Error de servidor en registrarNuevoLote:', err);
    return { success: false, message: 'Error inesperado al registrar el lote.' };
  }
}

/**
 * 3. Procesa el despacho de una cotización aplicando el algoritmo FIFO.
 * 🔥 Llama a la función RPC de Supabase que hace todo en una transacción:
 *    - Valida stock
 *    - Descuenta de lotes más antiguos
 *    - Crea orden de despacho
 *    - Registra trazabilidad
 *    - Cambia estado a APROBADO_DESPACHO
 */
export async function procesarDespachoCotizacionFIFO(
  idCotizacion: string
): Promise<{ success: boolean; message: string; id_orden?: string }> {
  try {
    // Llamada a la función PostgreSQL (todo transaccional, sin sobreventa)
    const { data, error } = await supabase.rpc('procesar_despacho_fifo', {
      p_cotizacion_id: idCotizacion,
    });

    if (error) {
      // Aquí caen los RAISE EXCEPTION del SQL (ej: "Stock insuficiente")
      return { success: false, message: error.message };
    }

    return {
      success: true,
      id_orden: data?.id_orden,
      message: `✅ Despacho FIFO procesado. Orden: ${data?.numero_orden}`,
    };
  } catch (err: any) {
    console.error('Error de servidor en procesarDespachoCotizacionFIFO:', err);
    return { success: false, message: 'Error de servidor al procesar el despacho.' };
  }
}

/**
 * 4. Obtiene la lista de órdenes de despacho generadas (para facturación)
 */
export async function obtenerOrdenesProcesadas(): Promise<OrdenDespachoEntity[]> {
  try {
    const { data, error } = await supabase
      .from('ordenes_despacho')
      .select(`
        *,
        cotizaciones (
          id_cotizacion,
          numero_cotizacion,
          cliente_tipo,
          cliente_nombre,
          total
        )
      `)
      .eq('estado', 'PROCESADO')
      .order('fecha_despacho', { ascending: false });

    if (error) {
      console.error('Error al consultar órdenes de despacho:', error.message);
      return [];
    }

    return (data || []).map((o: any) => ({
      ...o,
      cotizaciones: o.cotizaciones || null,
    }));
  } catch (err) {
    console.error('Error imprevisto en obtenerOrdenesProcesadas:', err);
    return [];
  }
}

/**
 * 5. Obtiene el Picking List (qué lotes sacar físicamente) de una orden
 */
export async function obtenerPickingList(idOrden: string) {
  try {
    const { data, error } = await supabase
      .from('despacho_lotes_detalles')
      .select(`
        id_despacho_detalle,
        cantidad_descontada,
        lotes (
          id_lote,
          codigo_lote,
          fecha_vencimiento,
          productos (item_code, nombre)
        )
      `)
      .eq('id_orden', idOrden);

    if (error) {
      console.error('Error al obtener picking list:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error en obtenerPickingList:', err);
    return [];
  }
}