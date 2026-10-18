// ============================================================================
// CONTROLADOR DE FACTURACIÓN, COMPROBANTES FISCALES Y CUENTAS BANCARIAS
// Ubicación: controllers/facturaController.ts
// ============================================================================

import { supabase } from '../lib/supabase';
import { OrdenDespachoEntity } from '../models/agrolactec';

/**
 * Consulta las órdenes despachadas pendientes de facturar
 */
export async function obtenerOrdenesPorFacturar(): Promise<OrdenDespachoEntity[]> {
  const { data, error } = await supabase
    .from('ordenes_despacho')
    .select('*')
    .eq('estado_pago', 'PENDIENTE')
    .order('fecha_despacho', { ascending: false });

  if (error) {
    console.error('Error al obtener órdenes por facturar:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Consulta las cuentas bancarias de AgroLactec
 */
export async function obtenerCuentasBancarias() {
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
 * Emite la factura o CCF y registra la transferencia o cobro Wompi
 */
export async function emitirComprobanteFiscal(datos: {
  id_orden: string;
  tipo_documento: 'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL_CCF';
  cliente_nombre: string;
  nit_nrc_cliente?: string;
  subtotal_neto: number;
  iva_13: number;
  monto_total: number;
  metodo_pago: 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE' | 'WOMPI_SANDBOX';
  id_cuenta_destino?: string;
  numero_comprobante_banco?: string;
}): Promise<{ success: boolean; message: string; numero_documento?: string }> {
  try {
    const prefijo = datos.tipo_documento === 'CREDITO_FISCAL_CCF' ? 'CCF' : 'FAC';
    const numeroDoc = `${prefijo}-${Date.now().toString().slice(-6)}`;

    // 1. Guardar comprobante fiscal
    const { error: errComp } = await supabase.from('comprobantes_fiscales').insert([
      {
        numero_documento: numeroDoc,
        tipo_documento: datos.tipo_documento,
        id_orden: datos.id_orden,
        cliente_nombre: datos.cliente_nombre,
        nit_nrc_cliente: datos.nit_nrc_cliente || null,
        subtotal_neto: datos.subtotal_neto,
        iva_13: datos.iva_13,
        monto_total: datos.monto_total,
        metodo_pago: datos.metodo_pago,
        id_cuenta_destino: datos.id_cuenta_destino || null,
        numero_comprobante_banco: datos.numero_comprobante_banco || null,
      },
    ]);

    if (errComp) {
      return { success: false, message: `Error al emitir comprobante: ${errComp.message}` };
    }

    // 2. Actualizar estado de la orden de despacho a PAGADO
    await supabase.from('ordenes_despacho').update({ estado_pago: 'PAGADO' }).eq('id_orden', datos.id_orden);

    return {
      success: true,
      numero_documento: numeroDoc,
      message: `✅ Comprobante Fiscal ${numeroDoc} emitido correctamente.`,
    };
  } catch (err) {
    return { success: false, message: 'Error de servidor al emitir comprobante.' };
  }
}