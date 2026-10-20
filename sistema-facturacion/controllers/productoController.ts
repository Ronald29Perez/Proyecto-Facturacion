// ============================================================================
// CONTROLADOR DE PRODUCTOS (CREACIÓN, EDICIÓN Y ESTADO)
// Ubicación: controllers/productoController.ts
// BD: v3.0 — usa jerarquía categorias → subcategorias + proveedores
// ============================================================================

import { supabase } from '../lib/supabase';
import { 
  ProductoEntity, 
  CategoriaEntity, 
  SubcategoriaEntity,
  ProveedorEntity 
} from '../models/agrolactec';

import { parsearArchivoCSV, detectarColumnasProducto, normalizarTexto, limpiarNumero } from './csvController';

// ============================================================================
// 1. OBTENER CATÁLOGOS AUXILIARES (para selects y filtros)
// ============================================================================

export async function obtenerCategorias(): Promise<CategoriaEntity[]> {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('activa', true)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error al obtener categorías:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de servidor:', err);
    return [];
  }
}

export async function obtenerSubcategorias(idCategoria?: string): Promise<SubcategoriaEntity[]> {
  try {
    let query = supabase
      .from('subcategorias')
      .select('*')
      .eq('activa', true)
      .order('nombre', { ascending: true });

    if (idCategoria) {
      query = query.eq('id_categoria', idCategoria);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener subcategorías:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de servidor:', err);
    return [];
  }
}

export async function obtenerProveedores(): Promise<ProveedorEntity[]> {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener proveedores:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de servidor:', err);
    return [];
  }
}

/**
 * Carga TODO en paralelo (ideal para el formulario de nuevo producto)
 */
export async function obtenerListasParaFormulario() {
  const [categorias, subcategorias, proveedores] = await Promise.all([
    obtenerCategorias(),
    obtenerSubcategorias(),
    obtenerProveedores(),
  ]);

  return { categorias, subcategorias, proveedores };
}

// ============================================================================
// 2. OBTENER CATÁLOGO COMPLETO (con JOINs)
// ============================================================================

export async function obtenerProductosCatalogo(): Promise<ProductoEntity[]> {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias (id_categoria, nombre, icono),
        subcategorias (id_subcategoria, nombre),
        proveedores (id_proveedor, nombre)
      `)
      .order('item_code', { ascending: true });

    if (error) {
      console.error('Error al obtener catálogo:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de servidor:', err);
    return [];
  }
}

/**
 * Solo productos activos (para el catálogo del cliente)
 */
export async function obtenerProductosActivos(): Promise<ProductoEntity[]> {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias (id_categoria, nombre, icono),
        subcategorias (id_subcategoria, nombre)
      `)
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error al obtener productos activos:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error de servidor:', err);
    return [];
  }
}

// ============================================================================
// 3. GUARDAR / ACTUALIZAR PRODUCTO
// ============================================================================

export async function guardarOActualizarProducto(
  producto: Partial<ProductoEntity>
): Promise<{ success: boolean; message: string }> {
  try {
    // 🔥 Ajustado a las columnas de la BD v3.0
    const payload = {
      item_code: producto.item_code,
      nombre: producto.nombre,
      id_categoria: producto.id_categoria,
      id_subcategoria: producto.id_subcategoria || null,
      id_proveedor: producto.id_proveedor || null,
      nso: producto.nso || null,
      descripcion: producto.descripcion || null,
      unidad_medida: producto.unidad_medida || 'CAJA',
      precio_b2c: producto.precio_b2c || 0,
      precio_b2b: producto.precio_b2b || 0,
      unidades_por_caja: producto.unidades_por_caja || 1,
      imagen_url: producto.imagen_url || null,
      activo: producto.activo !== undefined ? producto.activo : true,
    };

    if (producto.id_producto) {
      // Edición
      const { error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id_producto', producto.id_producto);

      if (error) throw error;
      return { success: true, message: '✅ Producto actualizado correctamente.' };
    } else {
      // Registro nuevo (id_producto se autogenera con gen_random_uuid())
      const { error } = await supabase.from('productos').insert([payload]);
      if (error) throw error;
      return { success: true, message: '✅ Producto registrado exitosamente.' };
    }
  } catch (err: any) {
    console.error('Error al guardar producto:', err.message);
    return { success: false, message: `Error en la base de datos: ${err.message}` };
  }
}

// ============================================================================
// 4. CAMBIAR ESTADO (Activo / Descontinuado)
// ============================================================================

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
    console.error('Error al cambiar estado:', err.message);
    return { success: false, message: `Error al cambiar estado: ${err.message}` };
  }
}

// ============================================================================
// 5. IMPORTACIÓN MASIVA DESDE CSV (con mapeo de nombres a UUIDs)
// ============================================================================

/**
 * Recibe filas crudas del CSV (con nombres, no IDs) y las convierte a la BD.
 * Formato CSV esperado:
 * item_code, nombre, categoria, subcategoria, proveedor, nso, precio_b2c, precio_b2b, unidades_por_caja, unidad_medida
 */
export async function importarProductosDesdeCSV(filasCSV: any[]): Promise<{
  success: boolean;
  message: string;
  importados: number;
  errores: string[];
}> {
  try {
    const { categorias, subcategorias, proveedores } = await obtenerListasParaFormulario();

    // Mapas para búsqueda rápida por nombre (lowercase)
    const mapaCats = new Map(categorias.map(c => [c.nombre.toLowerCase().trim(), c.id_categoria]));
    const mapaSubs = new Map(subcategorias.map(s => [s.nombre.toLowerCase().trim(), s.id_subcategoria]));
    const mapaProvs = new Map(proveedores.map(p => [p.nombre.toLowerCase().trim(), p.id_proveedor]));

    const productosAInsertar: any[] = [];
    const errores: string[] = [];

    for (const [i, fila] of filasCSV.entries()) {
      const nroFila = i + 2; // +2 porque la fila 1 es el header
      
      const catNombre = (fila.categoria || '').toLowerCase().trim();
      const subNombre = (fila.subcategoria || '').toLowerCase().trim();
      const provNombre = (fila.proveedor || '').toLowerCase().trim();

      const id_categoria = mapaCats.get(catNombre);
      const id_subcategoria = subNombre ? mapaSubs.get(subNombre) : null;
      const id_proveedor = provNombre ? mapaProvs.get(provNombre) : null;

      if (!id_categoria) {
        errores.push(`Fila ${nroFila}: categoría "${fila.categoria}" no existe.`);
        continue;
      }
      if (subNombre && !id_subcategoria) {
        errores.push(`Fila ${nroFila}: subcategoría "${fila.subcategoria}" no existe en la categoría.`);
        continue;
      }

      productosAInsertar.push({
        item_code: fila.item_code?.trim(),
        nombre: fila.nombre?.trim(),
        id_categoria,
        id_subcategoria,
        id_proveedor,
        nso: fila.nso?.trim() || null,
        precio_b2c: parseFloat(fila.precio_b2c) || 0,
        precio_b2b: parseFloat(fila.precio_b2b) || 0,
        unidades_por_caja: parseInt(fila.unidades_por_caja) || 1,
        unidad_medida: fila.unidad_medida || 'CAJA',
        activo: true,
      });
    }

    if (productosAInsertar.length === 0) {
      return { success: false, message: 'Ninguna fila válida para importar.', importados: 0, errores };
    }

    const { error } = await supabase.from('productos').insert(productosAInsertar);
    if (error) throw error;

    return {
      success: true,
      importados: productosAInsertar.length,
      message: `✅ ${productosAInsertar.length} productos importados correctamente.`,
      errores,
    };
  } catch (err: any) {
    console.error('Error en importación CSV:', err.message);
    return { success: false, message: `Error: ${err.message}`, importados: 0, errores: [] };
  }
}

// ============================================================================
// 6. EXPORTACIÓN CSV (con nombres legibles)
// ============================================================================

export async function importarProductosDesdeArchivo(file: File) {
  // 1. Parsear el archivo
  const parseo = await parsearArchivoCSV(file);
  if (!parseo.success) return { success: false, message: parseo.message, importados: 0, errores: [] };

  // 2. Detectar columnas (por si el CSV tiene headers variables)
  const headers = Object.keys(parseo.datos[0] || {});
  const mapa = detectarColumnasProducto(headers);

  // 3. Convertir a la estructura esperada por `importarProductosDesdeCSV`
  const filasNormalizadas = parseo.datos.map((fila: any) => ({
    item_code: fila[mapa.item_code || ''] || '',
    nombre: fila[mapa.nombre || ''] || '',
    categoria: fila[mapa.categoria || ''] || '',
    subcategoria: fila[mapa.subcategoria || ''] || '',
    proveedor: fila[mapa.proveedor || ''] || '',
    nso: fila[mapa.nso || ''] || '',
    precio_b2c: limpiarNumero(fila[mapa.precio_b2c || '']),
    precio_b2b: limpiarNumero(fila[mapa.precio_b2b || '']),
    unidades_por_caja: limpiarNumero(fila[mapa.unidades_por_caja || '']) || 1,
    unidad_medida: fila[mapa.unidad_medida || ''] || 'CAJA',
  }));

  // 4. Delegar al productoController
  return await importarProductosDesdeCSV(filasNormalizadas);
}