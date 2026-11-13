// ============================================================================
// CONTROLADOR DE UTILIDADES CSV (Parseo, Formateo, Descarga)
// Ubicación: controllers/csvController.ts
// BD: v3.0 — no toca la BD, solo manipula archivos
// ============================================================================

import Papa from 'papaparse';

// ============================================================================
// 1. NORMALIZACIÓN DE TEXTO
// ============================================================================

/**
 * Quita tildes, mayúsculas y caracteres especiales
 */
export function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Convierte "$1,234.56" o "1.234,56" a número válido
 */
export function limpiarNumero(val: any): number {
  if (val === undefined || val === null) return 0;
  const str = String(val)
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// ============================================================================
// 2. DESCARGA CSV (desde cualquier array de objetos)
// ============================================================================

/**
 * Genera un CSV y lo descarga forzando el navegador
 */
export function descargarCSV(
  datos: Record<string, any>[],
  nombreArchivo: string
): void {
  try {
    if (!datos || datos.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const csvString = Papa.unparse(datos, {
      delimiter: ',',
      header: true,
    });

    // BOM para que Excel respete tildes
    const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error al descargar CSV:', err);
    alert('Error al generar el archivo CSV.');
  }
}

// ============================================================================
// 3. PARSEO DE CSV (desde archivo subido)
// ============================================================================

export interface ResultadoParseoCSV {
  success: boolean;
  message: string;
  datos: Record<string, string>[];  // Filas ya parseadas
}

/**
 * Lee un archivo CSV y devuelve las filas crudas como objetos.
 * NO guarda en BD, solo parsea.
 */
export function parsearArchivoCSV(file: File): Promise<ResultadoParseoCSV> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,           // Primera fila son los headers
      skipEmptyLines: 'greedy',
      transformHeader: (h) => normalizarTexto(h),  // Normalizamos los headers
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            resolve({ success: false, message: 'El archivo está vacío.', datos: [] });
            return;
          }

          // Filtrar filas vacías
          const filasLimpias = (results.data as any[]).filter(
            (fila) => Object.values(fila).some((v) => v && String(v).trim() !== '')
          );

          if (filasLimpias.length === 0) {
            resolve({ success: false, message: 'No hay filas con datos.', datos: [] });
            return;
          }

          resolve({
            success: true,
            message: `${filasLimpias.length} filas leídas.`,
            datos: filasLimpias,
          });
        } catch (err) {
          console.error('Error al procesar CSV:', err);
          resolve({ success: false, message: 'Error al procesar el archivo.', datos: [] });
        }
      },
      error: (err) => {
        resolve({ success: false, message: `Error de lectura: ${err.message}`, datos: [] });
      },
    });
  });
}

// ============================================================================
// 4. MAPEO DE COLUMNAS (detecta automáticamente los headers)
// ============================================================================

export interface MapaColumnasProducto {
  item_code: string;
  nombre: string;
  categoria: string;
  subcategoria: string;
  proveedor: string;
  nso: string;
  precio_b2c: string;
  precio_b2b: string;
  unidades_por_caja: string;
  unidad_medida: string;
}

/**
 * Detecta qué columna del CSV corresponde a cada campo esperado.
 * Tolera variaciones como "Código Item", "UPC", "Precio Detalle", etc.
 */
export function detectarColumnasProducto(headers: string[]): Partial<MapaColumnasProducto> {
  const normHeaders = headers.map(h => normalizarTexto(h));

  const buscar = (variantes: string[]): string => {
    for (const variante of variantes) {
      const idx = normHeaders.findIndex(h => h.includes(variante));
      if (idx !== -1) return headers[idx];
    }
    return '';
  };

  return {
    item_code: buscar(['itemcode', 'codigo', 'item', 'sku']),
    nombre: buscar(['nombre', 'producto', 'descripcion']),
    categoria: buscar(['categoria', 'rubro']),
    subcategoria: buscar(['subcategoria', 'sub']),
    proveedor: buscar(['proveedor', 'marca']),
    nso: buscar(['nso', 'registro', 'sanitario']),
    precio_b2c: buscar(['preciob2c', 'detalle', 'preciodetalle', 'minorista']),
    precio_b2b: buscar(['preciob2b', 'mayoreo', 'preciomayoreo', 'mayorista']),
    unidades_por_caja: buscar(['unidades', 'caja', 'factor']),
    unidad_medida: buscar(['unidadmedida', 'medida', 'empaque']),
  };
}