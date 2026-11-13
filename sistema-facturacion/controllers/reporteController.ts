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
      despacho_lotes_detalles!id_orden (
        cantidad_descontada,
        lotes!id_lote ( 
          codigo_lote, 
          fecha_vencimiento, 
          productos (item_code, nombre)
        )
      )
    `)
    .order('fecha_despacho', { ascending: false });
    
  if (error) console.error(error);
  return data || [];
}

export async function obtenerHistorialFacturas() {
  const { data, error } = await supabase
    .from('facturas')
    .select(`
      *,
      items_factura (
        *,
        productos (nombre)
      ),
      ordenes_despacho (numero_orden)
    `)
    .order('fecha_emision', { ascending: false });
  if (error) console.error(error);
  return data || [];
}

// Reportes de inventario valorizado

export async function obtenerInventarioValorizado() {
  try {
    const { data, error } = await supabase
      .from('lotes')
      .select(`
        *,
        productos (
          nombre,
          item_code,
          precio_b2b,
          unidades_por_caja,
          unidad_medida
        )
      `)
      .gt('cantidad_disponible', 0)
      .order('fecha_vencimiento', { ascending: true });

    if (error) throw error;

    const inventario = (data || []).map((lote: any) => {
      // 1. Obtenemos la cantidad total que hay en la BD (que es en unidades base)
      const cantidadTotal = lote.cantidad_disponible;
      // 2. Obtenemos el factor de conversión de la caja (ej. 24)
      const factor = Number(lote.productos?.unidades_por_caja) || 1;
      // 3. Revisamos cómo se vende
      const unidadVenta = lote.productos?.unidad_medida;

      let cajasCerradas = 0;
      let unidadesSueltas = 0;

      // 🔥 LA MAGIA: Si se vende por caja, las cajas son el total.
      // Si se vende por unidad, dividimos.
      if (unidadVenta === 'CAJA') {
        cajasCerradas = cantidadTotal;
        unidadesSueltas = 0;
      } else {
        cajasCerradas = Math.floor(cantidadTotal / factor);
        unidadesSueltas = cantidadTotal % factor;
      }

      // 4. Calculamos el valor (Precio B2B * Cajas)
      const precioB2B = Number(lote.productos?.precio_b2b) || 0;
      const valorTotal = precioB2B * cajasCerradas;

      // 5. Calculamos días para vencer
      const dias = Math.ceil((new Date(lote.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...lote,
        cajas_cerradas: cajasCerradas,
        unidades_sueltas: unidadesSueltas,
        total_unidades_reales: cantidadTotal,
        valor_total: valorTotal,
        dias_para_vencer: dias,
      };
    });

    const valorTotalBodega = inventario.reduce((acc, item) => acc + item.valor_total, 0);
    const totalCajas = inventario.reduce((acc, item) => acc + item.cajas_cerradas, 0);

    return { inventario, valorTotalBodega, totalCajas };
  } catch (err) {
    console.error('Error al obtener inventario:', err);
    return { inventario: [], valorTotalBodega: 0, totalCajas: 0 };
  }
}