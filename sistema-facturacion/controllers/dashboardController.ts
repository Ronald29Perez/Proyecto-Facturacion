// controllers/dashboardController.ts
import { supabase } from '../lib/supabase';

export async function obtenerDatosDashboard() {
  try {
    // 1. Ventas Totales (Facturas)
    const { data: facturas } = await supabase.from('facturas').select('total, fecha_emision');
    const ventasTotales = facturas?.reduce((acc, f) => acc + Number(f.total), 0) || 0;
    
    // Ventas del día de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const ventasHoy = facturas?.filter(f => f.fecha_emision.startsWith(hoy))
                              .reduce((acc, f) => acc + Number(f.total), 0) || 0;

    // 2. Pedidos Pendientes
    const { count: pedidosPendientes } = await supabase
      .from('cotizaciones')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'PENDIENTE');

    // 3. Productos con Stock Bajo (menos de 10 cajas)
    const { data: lotes } = await supabase.from('lotes').select('cantidad_disponible, productos(nombre)');
    const stockBajo = lotes?.filter(l => l.cantidad_disponible < 10) || [];

    // 4. Lotes por Vencer (en los próximos 7 días)
    const en7Dias = new Date();
    en7Dias.setDate(en7Dias.getDate() + 7);
    const { data: lotesVencer } = await supabase
      .from('lotes')
      .select('codigo_lote, fecha_vencimiento, cantidad_disponible, productos(nombre)')
      .lte('fecha_vencimiento', en7Dias.toISOString().split('T')[0])
      .gt('cantidad_disponible', 0);

    // 5. 🔥 Productos Más Vendidos (Usando cotizacion_detalles)
    const { data: detallesVentas } = await supabase
      .from('cotizacion_detalles')
      .select(`
        cantidad,
        productos (nombre)
      `);

    // Agrupar y sumar cantidades por producto
    const productosContador: Record<string, number> = {};
    (detallesVentas || []).forEach((item: any) => {
      const nombre = item.productos?.nombre || 'Desconocido';
      productosContador[nombre] = (productosContador[nombre] || 0) + item.cantidad;
    });

    // Convertir a un arreglo y ordenar de mayor a menor (Top 5)
    const productosMasVendidos = Object.entries(productosContador)
      .map(([name, value]) => ({ name, ventas: value }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 5);

    // 6. Retornar TODO junto al final
    return {
      ventasTotales,
      ventasHoy,
      pedidosPendientes: pedidosPendientes || 0,
      stockBajo,
      lotesVencer: lotesVencer || [],
      facturasRecientes: facturas?.slice(-5).reverse() || [],
      productosMasVendidos, // 🔥 NUEVO
    };

  } catch (error) {
    console.error('Error en Dashboard:', error);
    return null;
  }
}