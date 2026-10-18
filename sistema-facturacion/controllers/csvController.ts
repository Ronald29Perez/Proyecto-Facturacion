// ============================================================================
// CONTROLADOR DE IMPORTACIÓN Y EXPORTACIÓN MASIVA CSV
// Ubicación: controllers/csvController.ts
// ============================================================================

import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { ProductoEstructurado, Categoria, Proveedor } from '../models/agrolactec';

/**
 * Normaliza cadenas quitando tildes, mayúsculas y caracteres especiales
 */
function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Convierte textos con símbolos de moneda y comas a números decimales válidos
 */
function limpiarNumero(val: any): number {
  if (val === undefined || val === null) return 0;
  const str = String(val)
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * 1. Convierte el catálogo de productos a CSV y fuerza la descarga
 */
  /**
         * Convierte el catálogo de productos a formato CSV y fuerza la descarga.
         * Si la lista en memoria está vacía, consulta directamente a Supabase.
         */
        export async function exportarProductosCSV(productosEnMemoria: ProductoEstructurado[]) {
        try {
            let listaFinal: ProductoEstructurado[] = productosEnMemoria;

            // Si la lista recibida está vacía, consultamos directamente a Supabase
            if (!listaFinal || listaFinal.length === 0) {
            const { data, error } = await supabase
                .from('productos')
                .select(`
                *,
                categorias (nombre_categoria),
                proveedores (nombre_proveedor)
                `)
                .eq('activo', true);

            if (error) {
                alert(`Error al obtener productos para exportar: ${error.message}`);
                return;
            }

            listaFinal = (data || []).map((p: any) => ({
                ...p,
                nombre_categoria: p.categorias?.nombre_categoria || '',
                nombre_proveedor: p.proveedores?.nombre_proveedor || '',
            }));
            }

            if (listaFinal.length === 0) {
            alert('No existen productos registrados en la base de datos para exportar.');
            return;
            }

            // Prepara los datos con los nombres de columnas estándar para Excel / CSV
            const datosFormateados = listaFinal.map((p) => ({
            'Codigo_Item': p.item_code || '',
            'UPC_Codigo_Barras': p.codigo_barras || p.upc || '',
            'Nombre_Producto': p.nombre_producto || (p as any).nombre || '',
            'Categoria': p.categoria?.nombre_categoria || p.nombre_categoria || '',
            'Proveedor': p.proveedor?.nombre_proveedor || p.nombre_proveedor || '',
            'Unidades_Por_Caja': p.unidades_por_caja || 12,
            'Precio_Detalle_B2C': p.precio_detalle || 0,
            'Precio_Mayoreo_B2B': p.precio_mayoreo || 0,
            }));

            // Genera la cadena CSV mediante PapaParse
            const csvString = Papa.unparse(datosFormateados, {
            delimiter: ',',
            header: true,
            });

            // Crear el archivo Blob y forzar la descarga en el navegador
            const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
            'download',
            `Catalogo_Productos_AgroLactec_${new Date().toISOString().slice(0, 10)}.csv`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error al exportar productos a CSV:', err);
            alert('Ocurrió un error inesperado al generar el archivo CSV.');
        }
        }

/**
 * 2. Importa el catálogo desde un archivo CSV mapeando a la columna 'codigo_barras'
 */
export async function importarProductosCSV(
  file: File,
  categoriasExistentes: Categoria[],
  proveedoresExistentes: Proveedor[]
): Promise<{ success: boolean; message: string; procesados: number }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        try {
          const lineas = results.data as string[][];

          if (!lineas || lineas.length === 0) {
            resolve({ success: false, message: 'El archivo está vacío.', procesados: 0 });
            return;
          }

          // 1. Encontrar la fila donde están los encabezados
          let idxCabecera = -1;
          for (let i = 0; i < lineas.length; i++) {
            const filaNorm = lineas[i].map(normalizarTexto);
            if (
              filaNorm.some((c) => c.includes('codigo') || c.includes('item')) &&
              filaNorm.some((c) => c.includes('nombre') || c.includes('producto'))
            ) {
              idxCabecera = i;
              break;
            }
          }

          if (idxCabecera === -1) {
            resolve({
              success: false,
              message: 'No se encontraron las columnas de Código y Nombre en el archivo.',
              procesados: 0,
            });
            return;
          }

          const cabeceras = lineas[idxCabecera].map(normalizarTexto);
          const filasDatos = lineas.slice(idxCabecera + 1);

          // Buscar posiciones de cada columna en el CSV
          const idxItemCode = cabeceras.findIndex((c) => c.includes('codigo') || c.includes('item'));
          const idxNombre = cabeceras.findIndex((c) => c.includes('nombre') || c.includes('producto'));
          const idxCodigoBarras = cabeceras.findIndex((c) => c.includes('upc') || c.includes('barras') || c.includes('barcode'));
          const idxCat = cabeceras.findIndex((c) => c.includes('categoria'));
          const idxProv = cabeceras.findIndex((c) => c.includes('proveedor'));
          const idxUnidades = cabeceras.findIndex((c) => c.includes('unidades') || c.includes('caja'));
          const idxPrecioDet = cabeceras.findIndex((c) => c.includes('detalle') || c.includes('b2c'));
          const idxPrecioMay = cabeceras.findIndex((c) => c.includes('mayoreo') || c.includes('b2b'));

          const catMap = new Map(categoriasExistentes.map((c) => [normalizarTexto(c.nombre_categoria), c.id_categoria]));
          const provMap = new Map(proveedoresExistentes.map((p) => [normalizarTexto(p.nombre_proveedor), p.id_proveedor]));

          const productosAInsertar: any[] = [];

          for (const fila of filasDatos) {
            const itemCode = idxItemCode !== -1 ? (fila[idxItemCode] || '').trim() : '';
            const nombreProd = idxNombre !== -1 ? (fila[idxNombre] || '').trim() : '';

            if (!itemCode || !nombreProd) continue;

            const codigoBarrasVal = idxCodigoBarras !== -1 ? (fila[idxCodigoBarras] || '').trim() : '';
            const nomCat = idxCat !== -1 ? normalizarTexto(fila[idxCat]) : '';
            const nomProv = idxProv !== -1 ? normalizarTexto(fila[idxProv]) : '';

            const unidadesCaja = idxUnidades !== -1 ? limpiarNumero(fila[idxUnidades]) || 12 : 12;
            const precioDetalle = idxPrecioDet !== -1 ? limpiarNumero(fila[idxPrecioDet]) : 0;
            const precioMayoreo = idxPrecioMay !== -1 ? limpiarNumero(fila[idxPrecioMay]) : 0;

            const idCat = catMap.get(nomCat) || categoriasExistentes[0]?.id_categoria || null;
            const idProv = provMap.get(nomProv) || proveedoresExistentes[0]?.id_proveedor || null;

            // Mapeo exacto a las columnas de tu tabla 'productos' en Supabase
            productosAInsertar.push({
              id_producto: crypto.randomUUID(),
              item_code: itemCode,
              codigo_barras: codigoBarrasVal,
              nombre_producto: nombreProd,
              id_categoria: idCat,
              id_proveedor: idProv,
              unidades_por_caja: unidadesCaja,
              precio_detalle: precioDetalle,
              precio_mayoreo: precioMayoreo,
              activo: true,
            });
          }

          if (productosAInsertar.length === 0) {
            resolve({ success: false, message: 'No se encontraron datos válidos en el archivo.', procesados: 0 });
            return;
          }

          const { error } = await supabase.from('productos').insert(productosAInsertar);

          if (error) {
            console.error('Error al insertar en Supabase:', error.message);
            resolve({ success: false, message: `Error en la base de datos: ${error.message}`, procesados: 0 });
          } else {
            resolve({
              success: true,
              message: '✅ Importación masiva completada exitosamente.',
              procesados: productosAInsertar.length,
            });
          }
        } catch (err) {
          console.error('Error al procesar el archivo:', err);
          resolve({ success: false, message: 'Error al procesar el archivo CSV.', procesados: 0 });
        }
      },
    });
  });
      
}