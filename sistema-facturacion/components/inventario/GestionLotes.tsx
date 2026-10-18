// ============================================================================
// COMPONENTE: GESTIÓN DE LOTES Y ENTRADAS A BODEGA CON GENERACIÓN AUTOMÁTICA
// Ubicación: components/inventario/GestionLotes.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import { ProductoEstructurado, LoteEntity } from '../../models/agrolactec';

interface Props {
  productos: ProductoEstructurado[];
  lotes: LoteEntity[];
  onGuardarLote: (nuevoLote: {
    id_producto: string;
    codigo_lote: string;
    fecha_vencimiento: string;
    cajas_ingresadas: number;
    unidades_disponibles: number;
  }) => Promise<void>;
}

/**
 * Función que genera un código de lote trazable basado en la fecha y el producto
 * Ej: LOT-202610-201-482
 */
export function generarCodigoLoteAuto(itemCode: string = ''): string {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  
  // Extraer el código del ítem sin caracteres especiales (ej: "201-1" -> "201")
  const codigoLimpio = itemCode.replace(/\D/g, '').slice(0, 3) || 'GEN';
  
  // Número aleatorio de 3 dígitos para evitar duplicados en el mismo mes
  const secuencial = Math.floor(100 + Math.random() * 900);

  return `LOT-${anio}${mes}-${codigoLimpio}-${secuencial}`;
}

export default function GestionLotes({ productos, lotes, onGuardarLote }: Props) {
  const [idProducto, setIdProducto] = useState('');
  const [codigoLote, setCodigoLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [cajasIngresadas, setCajasIngresadas] = useState<number>(1);
  const [guardando, setGuardando] = useState(false);

  // Obtener el objeto del producto seleccionado
  const productoSeleccionado = productos.find((p) => p.id_producto === idProducto);

  // Handler al cambiar de producto: Autogenera el lote si el campo está vacío
  const handleSeleccionarProducto = (id: string) => {
    setIdProducto(id);
    const prod = productos.find((p) => p.id_producto === id);
    if (prod) {
      const nuevoCodigo = generarCodigoLoteAuto(prod.item_code);
      setCodigoLote(nuevoCodigo);
    }
  };

  // Handler para botón manual "⚡ Generar"
  const handleGenerarLoteManual = () => {
    const itemCode = productoSeleccionado ? productoSeleccionado.item_code : '';
    setCodigoLote(generarCodigoLoteAuto(itemCode));
  };

  // Cálculo dinámico de unidades físicas totales (Cajas * Unidades por Caja)
  const unidadesCalculadas = productoSeleccionado
    ? cajasIngresadas * (productoSeleccionado.unidades_por_caja || 1)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idProducto || !codigoLote || !fechaVencimiento || cajasIngresadas <= 0) {
      alert('Por favor completa todos los campos del lote.');
      return;
    }

    setGuardando(true);

    await onGuardarLote({
      id_producto: idProducto,
      codigo_lote: codigoLote,
      fecha_vencimiento: fechaVencimiento,
      cajas_ingresadas: Number(cajasIngresadas),
      unidades_disponibles: unidadesCalculadas,
    });

    setGuardando(false);

    // Limpiar formulario tras guardar
    setIdProducto('');
    setCodigoLote('');
    setFechaVencimiento('');
    setCajasIngresadas(1);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
      {/* COLUMNA IZQUIERDA: FORMULARIO DE REGISTRO DE LOTE */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>📦 Registrar Nuevo Lote de Cajas</h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
          {/* Selección de Producto */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Producto *:</label>
            <select
              value={idProducto}
              onChange={(e) => handleSeleccionarProducto(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
            >
              <option value="">-- Seleccionar Producto --</option>
              {productos.map((prod) => (
                <option key={prod.id_producto} value={prod.id_producto}>
                  {prod.nombre_producto} ({prod.item_code})
                </option>
              ))}
            </select>
          </div>

          {/* Código de Lote con Botón de Autogeneración */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Código de Lote / Caja *:</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                placeholder="Ej: LOTE-2026-001"
                value={codigoLote}
                onChange={(e) => setCodigoLote(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <button
                type="button"
                onClick={handleGenerarLoteManual}
                title="Generar Código de Lote Automático"
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                }}
              >
                ⚡ Generar
              </button>
            </div>
          </div>

          {/* Fecha de Vencimiento */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Fecha de Vencimiento *:</label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
            />
          </div>

          {/* Cantidad de Cajas Ingresadas */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Cantidad de Cajas Ingresadas *:</label>
            <input
              type="number"
              min="1"
              value={cajasIngresadas}
              onChange={(e) => setCajasIngresadas(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
            />
          </div>

          {/* Resumen Calculado de Unidades */}
          {productoSeleccionado && (
            <div style={{ padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.85rem' }}>
              💡 <strong>Total en Unidades:</strong> {unidadesCalculadas} unidades físicas ({cajasIngresadas} cajas × {productoSeleccionado.unidades_por_caja} und/caja).
            </div>
          )}

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={guardando}
            style={{
              padding: '12px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '5px',
            }}
          >
            {guardando ? 'Ingresando Lote...' : '📥 Registrar Entrada a Bodega'}
          </button>
        </form>
      </div>

      {/* COLUMNA DERECHA: TABLA DE INVENTARIO DE LOTES DISPONIBLES (FIFO) */}
      <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>📋 Lotes en Bodega (Ordenados por Vencimiento - FIFO)</h3>

        {lotes.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No hay lotes registrados en el inventario de bodega.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px' }}>Lote</th>
                  <th style={{ padding: '8px' }}>Producto</th>
                  <th style={{ padding: '8px' }}>Vencimiento</th>
                  <th style={{ padding: '8px' }}>Cajas Disponibles</th>
                  <th style={{ padding: '8px' }}>Unidades Disponibles</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote) => (
                  <tr key={lote.id_lote} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#0284c7' }}>{lote.codigo_lote}</td>
                    <td style={{ padding: '8px' }}>{lote.producto?.nombre_producto || 'Producto sin nombre'}</td>
                    <td style={{ padding: '8px' }}>{lote.fecha_vencimiento}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{lote.cajas_disponibles}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{lote.unidades_disponibles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}