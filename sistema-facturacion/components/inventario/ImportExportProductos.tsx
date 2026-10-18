// ============================================================================
// COMPONENTE: MODULO VISUAL DE IMPORTACIÓN Y EXPORTACIÓN DE PRODUCTOS
// Ubicación: components/inventario/ImportExportProductos.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import { ProductoEstructurado, Categoria, Proveedor } from '../../models/agrolactec';
import { exportarProductosCSV, importarProductosCSV } from '../../controllers/csvController';

interface Props {
  productos: ProductoEstructurado[];
  categorias: Categoria[];
  proveedores: Proveedor[];
  onRefrescarDatos: () => Promise<void>;
}

export default function ImportExportProductos({
  productos,
  categorias,
  proveedores,
  onRefrescarDatos,
}: Props) {
  const [procesando, setProcesando] = useState(false);

  const handleExportar = async () => {
    setProcesando(true);
    await exportarProductosCSV(productos);
    setProcesando(false);
  };

  const handleImportarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcesando(true);
    const res = await importarProductosCSV(file, categorias, proveedores);
    setProcesando(false);

    alert(`${res.message} (${res.procesados} productos cargados)`);

    if (res.success) {
      await onRefrescarDatos();
      e.target.value = '';
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
      }}
    >
      <div>
        <h4 style={{ margin: 0, color: '#1e293b' }}>📊 Carga y Exportación Masiva en Excel / CSV</h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
          Descarga el catálogo de productos actual o sube una hoja de cálculo CSV con nuevos registros.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleExportar}
          disabled={procesando}
          style={{
            backgroundColor: procesando ? '#94a3b8' : '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: procesando ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {procesando ? '⏳ Generando...' : '📥 Exportar Catálogo (.CSV)'}
        </button>

        <label
          style={{
            backgroundColor: procesando ? '#94a3b8' : '#16a34a',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: procesando ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            display: 'inline-block',
          }}
        >
          {procesando ? '⏳ Procesando...' : '📤 Importar CSV'}
          <input
            type="file"
            accept=".csv"
            disabled={procesando}
            onChange={handleImportarArchivo}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    </div>
  );
}