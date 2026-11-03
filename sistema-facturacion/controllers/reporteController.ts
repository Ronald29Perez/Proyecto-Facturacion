// controllers/reporteController.ts
import { supabase } from '../lib/supabase';

export async function obtenerHistorialCotizaciones() {
  const { data, error } = await supabase
    .from('cotizaciones')
    .select(`
      *, 
      cotizacion_detalles (*)
    `) // 🔥 Agregamos la relación aquí
    .order('fecha_emision', { ascending: false });
  if (error) console.error(error);
  return data || [];
}

export async function obtenerHistorialDespachos() {
  const { data, error } = await supabase
    .from('ordenes_despacho')
    .select(`
      *, 
      cotizaciones (cliente_nombre, numero_cotizacion),
      despacho_lotes_detalles (
        cantidad_descontada,
        lotes ( codigo_lote, fecha_vencimiento, productos (nombre) )
      )
    `) // 🔥 Agregamos la relación de los lotes aquí
    .order('fecha_despacho', { ascending: false });
  if (error) console.error(error);
  return data || [];
}

export async function obtenerHistorialFacturas() {
  const { data, error } = await supabase
    .from('facturas')
    .select(`*, ordenes_despacho (numero_orden)`)
    .order('fecha_emision', { ascending: false });
  if (error) console.error(error);
  return data || [];
}