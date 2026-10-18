// ============================================================================
// CONTROLADOR DE BODEGA, LOTES Y DESPACHO FIFO (CORREGIDO)
// Ubicación: controllers/despachoController.ts
// ============================================================================

import { supabase } from '../lib/supabase';
import { LoteEntity } from '../models/agrolactec';

/**
 * 1. Obtiene la lista de lotes ordenados por fecha de vencimiento (Estrategia FIFO)
 */
export async function obtenerLotesOrdenadosFIFO(): Promise<LoteEntity[]> {
  try {
    // CORRECCIÓN: Se actualiza 'nombre' por 'nombre_producto' en la relación
    const { data, error } = await supabase
      .from('lotes')
      .select(`
        *,
        productos (
          id_producto,
          item_code,
          nombre_producto,
          unidades_por_caja
        )
      `)
      .gt('unidades_disponibles', 0)
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      console.error('Error al consultar lotes FIFO:', error.message);
      return [];
    }

    // Mapear la información para asegurar compatibilidad con la interfaz LoteEntity
    const lotesFormateados: LoteEntity[] = (data || []).map((item: any) => ({
      id_lote: item.id_lote,
      id_producto: item.id_producto,
      codigo_lote: item.codigo_lote,
      fecha_ingreso: item.fecha_ingreso,
      fecha_vencimiento: item.fecha_vencimiento,
      cajas_ingresadas: item.cajas_ingresadas,
      cajas_disponibles: item.cajas_disponibles,
      unidades_disponibles: item.unidades_disponibles,
      estado_vencimiento: item.estado_vencimiento || 'NORMAL',
      producto: item.productos
        ? {
            id_producto: item.productos.id_producto,
            item_code: item.productos.item_code,
            nombre_producto: item.productos.nombre_producto,
            unidades_por_caja: item.productos.unidades_por_caja,
            // Fallback para propiedades obligatorias en la interfaz
            id_categoria: '',
            id_proveedor: '',
            precio_detalle: 0,
            precio_mayoreo: 0,
          }
        : undefined,
    }));

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
  cajas_ingresadas: number;
  unidades_disponibles: number;
}): Promise<{ success: boolean; message: string }> {
  try {
    const registro = {
      id_lote: crypto.randomUUID(),
      id_producto: nuevoLote.id_producto,
      codigo_lote: nuevoLote.codigo_lote,
      fecha_vencimiento: nuevoLote.fecha_vencimiento,
      cajas_ingresadas: nuevoLote.cajas_ingresadas,
      cajas_disponibles: nuevoLote.cajas_ingresadas,
      unidades_disponibles: nuevoLote.unidades_disponibles,
      estado_vencimiento: 'NORMAL',
    };

    const { error } = await supabase.from('lotes').insert([registro]);

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
 * 3. Procesa el despacho de una cotización aplicando el algoritmo de salida FIFO
 */
export async function procesarDespachoCotizacionFIFO(
  idCotizacion: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Actualizar estado de la cotización a DESPACHADA
    const { error } = await supabase
      .from('cotizaciones')
      .update({ estado: 'DESPACHADA' })
      .eq('id_cotizacion', idCotizacion);

    if (error) {
      return { success: false, message: `Error al actualizar cotización: ${error.message}` };
    }

    return { success: true, message: '✅ Cotización despachada correctamente en modo FIFO.' };
  } catch (err) {
    return { success: false, message: 'Error de servidor al procesar el despacho.' };
  }
}