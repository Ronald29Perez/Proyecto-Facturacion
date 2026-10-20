// ============================================================================
// CONTROLADOR DE FACTURACIÓN, COMPROBANTES FISCALES Y CUENTAS BANCARIAS
// Ubicación: controllers/facturaController.ts
// BD: v3.0 — usa tabla 'facturas' (no 'comprobantes_fiscales')
// ============================================================================

import { supabase } from '../lib/supabase';
import { 
  OrdenDespachoEntity, 
  CuentaBancariaEntity,
  FacturaEntity,
  TipoComprobante,
  CondicionPago,
  MetodoPago,
} from '../models/agrolactec';

/**
 * 1. Consulta las órdenes PROCESADAS pendientes de facturar
 * (En la v3.0 ya no existe 'estado_pago', usamos 'estado')
 */
export async function obtenerOrdenesPorFacturar(): Promise<OrdenDespachoEntity[]> {
  // 1. Traer órdenes procesadas
  const { data: ordenes, error: errOrdenes } = await supabase
    .from('ordenes_despacho')
    .select(`
      *,
      cotizaciones (
        id_cotizacion,
        numero_cotizacion,
        cliente_tipo,
        cliente_nombre,
        id_cliente,
        subtotal,
        impuesto_iva,
        total
      )
    `)
    .eq('estado', 'PROCESADO')
    .order('fecha_despacho', { ascending: false });

  if (errOrdenes) {
    console.error('Error al obtener órdenes por facturar:', errOrdenes.message);
    return [];
  }

  // 2. Filtrar las que ya tienen factura
  const { data: facturas } = await supabase
    .from('facturas')
    .select('id_orden');

  const idsFacturadas = new Set((facturas || []).map((f: any) => f.id_orden));

  return (ordenes || [])
    .filter((o: any) => !idsFacturadas.has(o.id_orden))
    .map((o: any) => ({
      ...o,
      cotizacion: o.cotizaciones || null,
    }));
}

/**
 * 2. Consulta las cuentas bancarias de AgroLactec
 */
export async function obtenerCuentasBancarias(): Promise<CuentaBancariaEntity[]> {
  const { data, error } = await supabase
    .from('cuentas_bancarias')
    .select('*')
    .eq('activa', true);

  if (error) {
    console.error('Error al obtener cuentas bancarias:', error.message);
    return [];
  }
  return data || [];
}

/**
 * 3. Emite la factura o CCF y actualiza todo el flujo
 */
export async function emitirComprobanteFiscal(datos: {
  id_orden: string;
  tipo_comprobante: TipoComprobante;         // 'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL'
  condicion_pago: CondicionPago;             // 'CONTADO' | 'CREDITO_15_DIAS' | 'CREDITO_30_DIAS'
  metodo_pago: MetodoPago;                   // 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'
  id_cuenta_bancaria?: string;
  numero_comprobante?: string;
}): Promise<{ success: boolean; message: string; correlativo?: string }> {
  try {
    // ========================================================================
    // PASO 1: Obtener la orden + su cotización
    // ========================================================================
    const { data: orden, error: errOrden } = await supabase
      .from('ordenes_despacho')
      .select(`
        id_orden,
        estado,
        id_cotizacion,
        cotizaciones (
          id_cotizacion,
          numero_cotizacion,
          cliente_tipo,
          cliente_nombre,
          id_cliente,
          subtotal,
          impuesto_iva,
          total
        )
      `)
      .eq('id_orden', datos.id_orden)
      .single();

    if (errOrden || !orden) {
      return { success: false, message: 'Orden de despacho no encontrada.' };
    }

    if (orden.estado !== 'PROCESADO') {
      return { success: false, message: 'La orden debe estar PROCESADA antes de facturar.' };
    }

    const cot = orden.cotizaciones as any;
    if (!cot) {
      return { success: false, message: 'La orden no tiene cotización asociada.' };
    }

    // ========================================================================
    // PASO 2: Verificar que no esté ya facturada
    // ========================================================================
    const { data: existente } = await supabase
      .from('facturas')
      .select('id_factura')
      .eq('id_orden', datos.id_orden)
      .maybeSingle();

    if (existente) {
      return { success: false, message: 'Esta orden ya tiene un comprobante emitido.' };
    }

    // ========================================================================
    // PASO 3: Generar correlativo
    // ========================================================================
    const prefijo = datos.tipo_comprobante === 'CREDITO_FISCAL' ? 'CCF' : 'FAC';
    const correlativo = `${prefijo}-${Date.now().toString().slice(-8)}`;

    // ========================================================================
    // PASO 4: Insertar la factura
    // ========================================================================
    const { data: facturaCreada, error: errFactura } = await supabase
      .from('facturas')
      .insert([
        {
          correlativo,
          id_orden: datos.id_orden,
          tipo_comprobante: datos.tipo_comprobante,
          cliente_tipo: cot.cliente_tipo,
          cliente_nombre: cot.cliente_nombre,
          id_cliente: cot.id_cliente || null,
          condicion_pago: datos.condicion_pago,
          metodo_pago: datos.metodo_pago,
          id_cuenta_bancaria: datos.id_cuenta_bancaria || null,
          numero_comprobante: datos.numero_comprobante || null,
          subtotal: cot.subtotal,
          impuesto_iva: cot.impuesto_iva,
          total: cot.total,
        },
      ])
      .select()
      .single();

    if (errFactura || !facturaCreada) {
      return { success: false, message: `Error al emitir factura: ${errFactura?.message}` };
    }

    // ========================================================================
    // PASO 5: Copiar items de la cotización a items_factura
    // ========================================================================
    const { data: detallesCot } = await supabase
      .from('cotizacion_detalles')
      .select('*')
      .eq('id_cotizacion', cot.id_cotizacion);

    // Obtener el primer lote usado por producto desde el despacho (trazabilidad FIFO)
    const { data: lotesUsados } = await supabase
      .from('despacho_lotes_detalles')
      .select(`
        id_lote,
        lotes (id_producto)
      `)
      .eq('id_orden', datos.id_orden);

    const itemsData = (detallesCot || []).map((d: any) => {
      const loteUsado = (lotesUsados || []).find(
        (lu: any) => lu.lotes?.id_producto === d.id_producto
      );
      return {
        id_factura: facturaCreada.id_factura,
        id_producto: d.id_producto,
        id_lote: loteUsado?.id_lote || null,
        cantidad: d.cantidad,
        precio_aplicado: d.precio_unitario,
        subtotal: d.subtotal_item,
      };
    });

    if (itemsData.length > 0) {
      const { error: errItems } = await supabase.from('items_factura').insert(itemsData);
      if (errItems) {
        console.warn('⚠️ Factura creada pero falló insertar items:', errItems.message);
      }
    }

    // ========================================================================
    // PASO 6: Actualizar estados (orden → FACTURADO, cotización → FACTURADO)
    // ========================================================================
    await supabase
      .from('ordenes_despacho')
      .update({ estado: 'FACTURADO' })
      .eq('id_orden', datos.id_orden);

    await supabase
      .from('cotizaciones')
      .update({ estado: 'FACTURADO' })
      .eq('id_cotizacion', cot.id_cotizacion);

    // ========================================================================
    // RESULTADO
    // ========================================================================
    return {
      success: true,
      correlativo,
      message: `✅ Comprobante ${correlativo} emitido correctamente.`,
    };
  } catch (err: any) {
    console.error('Error en emitirComprobanteFiscal:', err);
    return { success: false, message: 'Error de servidor al emitir comprobante.' };
  }
}

/**
 * 4. Obtener historial de facturas emitidas
 */
export async function obtenerHistorialFacturas(): Promise<FacturaEntity[]> {
  const { data, error } = await supabase
    .from('facturas')
    .select(`
      *,
      ordenes_despacho (numero_orden, fecha_despacho),
      items_factura (
        id_item,
        cantidad,
        precio_aplicado,
        subtotal,
        productos (nombre, item_code),
        lotes (codigo_lote, fecha_vencimiento)
      )
    `)
    .order('fecha_emision', { ascending: false });

  if (error) {
    console.error('Error al obtener historial de facturas:', error.message);
    return [];
  }
  return data || [];
}