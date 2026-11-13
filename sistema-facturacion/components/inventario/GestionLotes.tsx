// ============================================================================
// COMPONENTE: GESTIÓN DE LOTES Y ENTRADAS A BODEGA
// Ubicación: components/inventario/GestionLotes.tsx
// BD: v3.1 — conversión automática de Cajas Físicas a Unidades Base
// ============================================================================

'use client';

import React, { useState } from 'react';
import { ProductoEntity, LoteEntity } from '../../models/agrolactec';

interface Props {
  productos: ProductoEntity[];
  lotes: LoteEntity[];
  onGuardarLote: (nuevoLote: {
    id_producto: string;
    codigo_lote: string;
    fecha_vencimiento: string;
    cantidad_ingresada: number;  // 🔥 Lo que el bodeguero escribe en cajas
  }) => Promise<void>;
}

/**
 * Genera un código de lote trazable
 * Ej: LOT-202610-201-482
 */
export function generarCodigoLoteAuto(itemCode: string = ''): string {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const codigoLimpio = itemCode.replace(/\D/g, '').slice(0, 3) || 'GEN';
  const secuencial = Math.floor(100 + Math.random() * 900);
  return `LOT-${anio}${mes}-${codigoLimpio}-${secuencial}`;
}

/**
 * Calcula el estado de vencimiento del lote
 */
function calcularEstadoVencimiento(fechaVencimiento: string): 'NORMAL' | 'POR_VENCER' | 'VENCIDO' {
  const hoy = new Date();
  const vence = new Date(fechaVencimiento);
  const dias = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return 'VENCIDO';
  if (dias <= 7) return 'POR_VENCER';
  return 'NORMAL';
}

export default function GestionLotes({ productos, lotes, onGuardarLote }: Props) {
  const [idProducto, setIdProducto] = useState('');
  const [codigoLote, setCodigoLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [cajasFisicas, setCajasFisicas] = useState<number>(1);
  const [guardando, setGuardando] = useState(false);

  const productoSeleccionado = productos.find((p) => p.id_producto === idProducto);

  const handleSeleccionarProducto = (id: string) => {
    setIdProducto(id);
    const prod = productos.find((p) => p.id_producto === id);
    if (prod) {
      setCodigoLote(generarCodigoLoteAuto(prod.item_code));
    }
  };

  const handleGenerarLoteManual = () => {
    const itemCode = productoSeleccionado ? productoSeleccionado.item_code : '';
    setCodigoLote(generarCodigoLoteAuto(itemCode));
  };

  // 🔥 Cálculo dinámico para mostrar en pantalla cuántas unidades se guardarán
  const esVentaPorCaja = productoSeleccionado?.unidad_medida === 'CAJA';
  const factorConversion = esVentaPorCaja ? 1 : (productoSeleccionado?.unidades_por_caja || 1);
  const unidadesCalculadas = cajasFisicas * factorConversion;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idProducto || !codigoLote || !fechaVencimiento || cajasFisicas <= 0) {
      alert('Por favor completa todos los campos del lote.');
      return;
    }

    setGuardando(true);
    
    // Enviamos "cantidad_ingresada". El controlador hará la magia de convertirla.
    await onGuardarLote({
      id_producto: idProducto,
      codigo_lote: codigoLote,
      fecha_vencimiento: fechaVencimiento,
      cantidad_ingresada: Number(cajasFisicas),
    });
    
    setGuardando(false);

    // Limpiar formulario
    setIdProducto('');
    setCodigoLote('');
    setFechaVencimiento('');
    setCajasFisicas(1);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
      {/* COLUMNA IZQUIERDA: FORMULARIO */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>
          📦 Registrar Nuevo Lote de Cajas
        </h3>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginTop: '15px',
          }}
        >
          {/* Producto */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
              Producto *:
            </label>
            <select
              value={idProducto}
              onChange={(e) => handleSeleccionarProducto(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
              }}
            >
              <option value="">-- Seleccionar Producto --</option>
              {productos.map((prod) => (
                <option key={prod.id_producto} value={prod.id_producto}>
                  {prod.nombre} ({prod.item_code})
                </option>
              ))}
            </select>
          </div>

          {/* Código de lote */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
              Código de Lote *:
            </label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                placeholder="Ej: LOTE-2026-001"
                value={codigoLote}
                onChange={(e) => setCodigoLote(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                }}
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

          {/* Fecha vencimiento */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
              Fecha de Vencimiento *:
            </label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
              }}
            />
          </div>

          {/* Cantidad de Cajas Físicas */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
              Cajas Físicas Recibidas del Proveedor *:
            </label>
            <input
              type="number"
              min="1"
              value={cajasFisicas}
              onChange={(e) => setCajasFisicas(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
              }}
            />
          </div>

          {/* Resumen de conversión */}
          {productoSeleccionado && (
            <div
              style={{
                padding: '10px',
                backgroundColor: esVentaPorCaja ? '#eff6ff' : '#f0fdf4',
                borderRadius: '6px',
                border: `1px solid ${esVentaPorCaja ? '#bfdbfe' : '#bbf7d0'}`,
                fontSize: '0.85rem',
                color: esVentaPorCaja ? '#1e3a8a' : '#166534',
              }}
            >
              {esVentaPorCaja ? (
                <>
                  📦 Este producto se vende por <strong>Caja</strong>. Se registrarán{' '}
                  <strong>{cajasFisicas} cajas</strong> en el inventario.
                </>
              ) : (
                <>
                  💡 <strong>Conversión automática:</strong> {cajasFisicas} cajas ×{' '}
                  {factorConversion} {productoSeleccionado.unidad_medida.toLowerCase()}(s)/caja ={' '}
                  <strong>{unidadesCalculadas} unidades</strong> en inventario.
                </>
              )}
            </div>
          )}

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
              cursor: guardando ? 'not-allowed' : 'pointer',
              marginTop: '5px',
            }}
          >
            {guardando ? 'Ingresando Lote...' : '📥 Registrar Entrada a Bodega'}
          </button>
        </form>
      </div>

      {/* COLUMNA DERECHA: TABLA DE LOTES */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
        }}
      >
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>
          📋 Lotes en Bodega (Ordenados por Vencimiento - FIFO)
        </h3>

        {lotes.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            No hay lotes registrados en el inventario de bodega.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
                marginTop: '10px',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f8fafc',
                    textAlign: 'left',
                    borderBottom: '2px solid #cbd5e1',
                  }}
                >
                  <th style={{ padding: '8px' }}>Lote</th>
                  <th style={{ padding: '8px' }}>Producto</th>
                  <th style={{ padding: '8px' }}>Vencimiento</th>
                  <th style={{ padding: '8px' }}>Stock Disponible</th>
                  <th style={{ padding: '8px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote) => {
                  const estado =
                    lote.estado_vencimiento ||
                    calcularEstadoVencimiento(lote.fecha_vencimiento);

                  const colorEstado =
                    estado === 'VENCIDO'
                      ? { bg: '#fee2e2', fg: '#b91c1c' }
                      : estado === 'POR_VENCER'
                      ? { bg: '#fef3c7', fg: '#a16207' }
                      : { bg: '#dcfce7', fg: '#15803d' };

                  return (
                    <tr key={lote.id_lote} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#0284c7' }}>
                        {lote.codigo_lote}
                      </td>
                      <td style={{ padding: '8px' }}>
                        {lote.productos?.nombre || 'Producto sin nombre'}
                      </td>
                      <td style={{ padding: '8px' }}>{lote.fecha_vencimiento}</td>
                      <td
                        style={{
                          padding: '8px',
                          color: '#16a34a',
                          fontWeight: 'bold',
                        }}
                      >
                        {lote.cantidad_disponible}{' '}
                        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#64748b' }}>
                          {lote.productos?.unidad_medida?.toLowerCase() || 'unidad'}(s)
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: colorEstado.bg,
                            color: colorEstado.fg,
                          }}
                        >
                          {estado === 'VENCIDO'
                            ? '🔴 Vencido'
                            : estado === 'POR_VENCER'
                            ? '🟡 Por vencer'
                            : '🟢 Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}