// components/inventario/ImportExportProductos.tsx
'use client';

import { useState } from 'react';
import { parsearArchivoCSV, descargarCSV } from '../../controllers/csvController';
import { 
  importarProductosDesdeArchivo, 
  obtenerProductosCatalogo 
} from '../../controllers/productoController';

interface Props {
  onImportComplete?: () => void;  // Para recargar la tabla padre
}

export default function ImportExportProductos({ onImportComplete }: Props) {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // ========================================
  // IMPORTAR CSV
  // ========================================
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCargando(true);
    setMensaje(null);

    try {
      const resultado = await importarProductosDesdeArchivo(file);

      if (resultado.success) {
        setMensaje({ tipo: 'ok', texto: resultado.message });
        // Recargar la tabla del padre
        if (onImportComplete) onImportComplete();
      } else {
        setMensaje({ tipo: 'error', texto: resultado.message });
      }

      // Si hubo errores parciales, mostrarlos
      if (resultado.errores.length > 0) {
        console.warn('Errores en filas:', resultado.errores);
        setMensaje({
          tipo: 'error',
          texto: `${resultado.message}\n\n${resultado.errores.slice(0, 5).join('\n')}`,
        });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error inesperado al importar.' });
    } finally {
      setCargando(false);
      e.target.value = ''; // Limpiar input para permitir subir el mismo archivo
    }
  };

  // ========================================
  // EXPORTAR CSV
  // ========================================
  const handleExport = async () => {
    setCargando(true);
    setMensaje(null);

    try {
      const productos = await obtenerProductosCatalogo();

      const datos = productos.map(p => ({
        item_code: p.item_code,
        nombre: p.nombre,
        categoria: p.categorias?.nombre || '',
        subcategoria: p.subcategorias?.nombre || '',
        proveedor: p.proveedores?.nombre || '',
        nso: p.nso || '',
        precio_b2c: p.precio_b2c,
        precio_b2b: p.precio_b2b,
        unidades_por_caja: p.unidades_por_caja,
        unidad_medida: p.unidad_medida,
        activo: p.activo ? 'SI' : 'NO',
      }));

      descargarCSV(datos, 'Catalogo_Productos_AgroLactec');
      setMensaje({ tipo: 'ok', texto: `✅ ${datos.length} productos exportados.` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al exportar el catálogo.' });
    } finally {
      setCargando(false);
    }
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📥 Carga y Exportación Masiva en Excel / CSV
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Descarga el catálogo actual o sube una hoja de cálculo CSV con nuevos registros.
          </p>
        </div>

        <div className="flex gap-3">
          {/* EXPORTAR */}
          <button
            onClick={handleExport}
            disabled={cargando}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            📤 Exportar Catálogo (.CSV)
          </button>

          {/* IMPORTAR (input file oculto) */}
          <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50">
            📥 Importar CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={cargando}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* MENSAJE DE RESULTADO */}
      {mensaje && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm whitespace-pre-line ${
            mensaje.tipo === 'ok'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* INDICADOR DE CARGA */}
      {cargando && (
        <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
          ⏳ Procesando...
        </div>
      )}

      {/* AYUDA: FORMATO ESPERADO */}
      <details className="mt-4 text-xs text-gray-500">
        <summary className="cursor-pointer font-medium">📋 Ver formato esperado del CSV</summary>
        <pre className="mt-2 bg-gray-50 p-3 rounded overflow-x-auto">
      {`item_code,nombre,categoria,subcategoria,proveedor,nso,precio_b2c,precio_b2b,unidades_por_caja,unidad_medida
      CR-201,Quesillo Super Suave 16 oz,Quesos,Queso de Hilo / Quesillo,Quesos El Rancho,NSO-001,2.50,54.00,24,CAJA
      LM-301,Leche Entera 1L,Lácteos,Leche Entera,Lácteos La Pradera,NSO-003,1.80,40.00,24,CAJA`}
        </pre>
      </details>
    </div>
  );
}