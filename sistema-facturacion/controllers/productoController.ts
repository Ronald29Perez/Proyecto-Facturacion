// ============================================================================
// CONTROLADOR DE PRODUCTOS (CREACIÓN, EDICIÓN Y ESTADO)
// Ubicación: controllers/productoController.ts
// ============================================================================

import { supabase } from '../lib/supabase';
import { ProductoEstructurado, Categoria, Proveedor } from '../models/agrolactec';

/**
 * 1. Obtiene la lista completa de categorías registradas en Supabase
 */
export async function obtenerCategorias(): Promise<Categoria[]> {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nombre_categoria', { ascending: true });

    if (error) {
      console.error('Error al obtener categorías:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error de servidor en obtenerCategorias:', err);
    return [];
  }
}

/**
 * 2. Obtiene la lista completa de proveedores registrados en Supabase
 */
export async function obtenerProveedores(): Promise<Proveedor[]> {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('nombre_proveedor', { ascending: true });

    if (error) {
      console.error('Error al obtener proveedores:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error de servidor en obtenerProveedores:', err);
    return [];
  }
}

/**
 * 3. Obtiene el catálogo completo de productos vinculando sus categorías y proveedores
 */
export async function obtenerProductosCatalogo(): Promise<ProductoEstructurado[]> {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias (nombre_categoria),
        proveedores (nombre_proveedor)
      `)
      .order('item_code', { ascending: true });

    if (error) {
      console.error('Error al obtener catálogo de productos:', error.message);
      return [];
    }

    // Mapeo seguro para aplanar los nombres de las relaciones
    const productosFormateados: ProductoEstructurado[] = (data || []).map((p: any) => ({
      ...p,
      nombre_producto: p.nombre_producto || p.nombre || '',
      nombre_categoria: p.categorias?.nombre_categoria || '',
      nombre_proveedor: p.proveedores?.nombre_proveedor || '',
    }));

    return productosFormateados;
  } catch (err) {
    console.error('Error de servidor en obtenerProductosCatalogo:', err);
    return [];
  }
}


/**
 * 4. Guarda (Inserta o Actualiza) un producto en Supabase
 */
export async function guardarOActualizarProducto(
  producto: Partial<ProductoEstructurado>
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      item_code: producto.item_code,
      codigo_barras: producto.codigo_barras || '',
      nombre_producto: producto.nombre_producto,
      id_categoria: producto.id_categoria,
      id_proveedor: producto.id_proveedor,
      subcategoria_agrupacion: producto.subcategoria_agrupacion || '',
      marca: producto.marca || '',
      presentacion_empaque: producto.presentacion_empaque || '',
      unidades_por_caja: producto.unidades_por_caja || 12,
      precio_detalle: producto.precio_detalle || 0,
      precio_mayoreo: producto.precio_mayoreo || 0,
      activo: producto.activo !== undefined ? producto.activo : true,
    };

    if (producto.id_producto) {
      // Edición de producto existente
      const { error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id_producto', producto.id_producto);

      if (error) throw error;
      return { success: true, message: '✅ Producto actualizado correctamente.' };
    } else {
      // Registro de un nuevo producto
      const { error } = await supabase.from('productos').insert([
        {
          id_producto: crypto.randomUUID(),
          ...payload,
        },
      ]);

      if (error) throw error;
      return { success: true, message: '✅ Producto registrado exitosamente.' };
    }
  } catch (err: any) {
    console.error('Error al guardar producto:', err.message);
    return { success: false, message: `Error en la base de datos: ${err.message}` };
  }
}

/**
 * 5. Cambia el estado (Activo / Descontinuado) de un producto
 */
export async function cambiarEstadoProducto(
  id_producto: string,
  nuevoEstado: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('productos')
      .update({ activo: nuevoEstado })
      .eq('id_producto', id_producto);

    if (error) throw error;

    const textoEstado = nuevoEstado ? 'reactivado' : 'descontinuado';
    return { success: true, message: `✅ Producto ${textoEstado} correctamente.` };
  } catch (err: any) {
    console.error('Error al cambiar estado del producto:', err.message);
    return { success: false, message: `Error al cambiar estado: ${err.message}` };
  }


}