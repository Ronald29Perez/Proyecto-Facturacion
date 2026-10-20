// ============================================================================
// COMPONENTE: GESTIÓN DE ÓRDENES DE DESPACHO Y MOTOR FIFO
// Ubicación: components/despacho/OrdenDespacho.tsx
// BD: v3.0 — incluye Picking List después de procesar
// ============================================================================

'use client';

import React, { useState } from 'react';
import { CotizacionEntity } from '../../models/agrolactec';
import { obtenerPickingList } from '../../controllers/despachoController';

interface Props {
  cotizacionesPendientes: CotizacionEntity[];
  onProcesarDespachoFIFO: (
    idCotizacion: string
  ) => Promise<{ success: boolean; message: string; id_orden?: string }>;
}

interface PickingItem {
  id_despacho_detalle: string;
  cantidad_descontada: number;
  lotes: {
    id_lote: string;
    codigo_lote: string;
    fecha_vencimiento: string;
    productos: { item_code: string; nombre: string };
  } | null;
}

export default function OrdenDespacho({
  cotizacionesPendientes,
  onProcesarDespachoFIFO,
}: Props) {
  const [cotizacionSeleccionada, setCotizacionSeleccionada] =
    useState<CotizacionEntity | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultadoDespacho, setResultadoDespacho] = useState<{
    success: boolean;
    message: string;
    id_orden?: string;
  } | null>(null);
  const [pickingList, setPickingList] = useState<PickingItem[]>([]);

  const handleProcesar = async (idCotizacion: string) => {
    if (
      !confirm(
        '¿Deseas procesar el despacho de esta cotización? Se descontará stock de los lotes más antiguos (FIFO).'
      )
    ) {
      return;
    }

    setProcesando(true);
    setResultadoDespacho(null);
    setPickingList([]);

    const respuesta = await onProcesarDespachoFIFO(idCotizacion);

    setProcesando(false);
    setResultadoDespacho(respuesta);

    if (respuesta.success) {
      setCotizacionSeleccionada(null);

      // 🆕 Si el controlador devolvió el id_orden, cargar el picking list
      if (respuesta.id_orden) {
        const lista = await obtenerPickingList(respuesta.id_orden);
        setPickingList(lista as unknown as PickingItem[]);
      }
    }
  };

  const handleImprimirPicking = () => {
    window.print();
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        gap: '20px',
        padding: '10px',
      }}
    >
      {/* ==================================================================== */}
      {/* BANDEJA DE COTIZACIONES PENDIENTES */}
      {/* ==================================================================== */}
      <div
        style={{
          border: '1px solid #cbd5e1',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
        }}
      >
        <h3>📥 Cotizaciones Recibidas ({cotizacionesPendientes.length})</h3>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '15px' }}>
          Selecciona una cotización recibida desde el carrito para ejecutar el
          despacho FIFO.
        </p>

        {cotizacionesPendientes.length === 0 ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#64748b',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
            }}
          >
            No hay cotizaciones pendientes por despachar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cotizacionesPendientes.map((cot) => (
              <div
                key={cot.id_cotizacion}
                onClick={() => setCotizacionSeleccionada(cot)}
                style={{
                  padding: '12px',
                  border:
                    cotizacionSeleccionada?.id_cotizacion === cot.id_cotizacion
                      ? '2px solid #2563eb'
                      : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor:
                    cotizacionSeleccionada?.id_cotizacion === cot.id_cotizacion
                      ? '#eff6ff'
                      : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>{cot.numero_cotizacion}</span>
                  <span style={{ color: '#2563eb' }}>
                    ${Number(cot.total).toFixed(2)}
                  </span>
                </div>
                <div
                  style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}
                >
                  Cliente: <strong>{cot.cliente_nombre}</strong> ({cot.cliente_tipo})
                </div>
                <div
                  style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}
                >
                  Fecha: {new Date(cot.fecha_emision).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* DETALLE Y EJECUCIÓN */}
      {/* ==================================================================== */}
      <div
        style={{
          border: '1px solid #cbd5e1',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
        }}
      >
        {cotizacionSeleccionada ? (
          <div>
            <h3>
              📦 Procesar Orden de Despacho: {cotizacionSeleccionada.numero_cotizacion}
            </h3>

            <div
              style={{
                padding: '10px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                margin: '12px 0',
                fontSize: '0.85rem',
              }}
            >
              <div>
                Cliente: <strong>{cotizacionSeleccionada.cliente_nombre}</strong>
              </div>
              <div>
                Tipo: <strong>{cotizacionSeleccionada.cliente_tipo}</strong>
              </div>
            </div>

            <h4>Ítems del Pedido:</h4>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                margin: '10px 0',
                fontSize: '0.85rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f1f5f9',
                    textAlign: 'left',
                    borderBottom: '2px solid #cbd5e1',
                  }}
                >
                  <th style={{ padding: '6px' }}>Producto</th>
                  <th style={{ padding: '6px' }}>Cantidad</th>
                  <th style={{ padding: '6px' }}>Empaque</th>
                  <th style={{ padding: '6px' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(
                  cotizacionSeleccionada.detalles ||
                  cotizacionSeleccionada.cotizacion_detalles ||
                  []
                ).map((det) => (
                  <tr key={det.id_detalle} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px' }}>{det.nombre_producto}</td>
                    <td style={{ padding: '6px', fontWeight: 'bold' }}>
                      {det.cantidad}
                    </td>
                    <td style={{ padding: '6px' }}>{det.unidad_medida}</td>
                    <td style={{ padding: '6px' }}>
                      ${Number(det.subtotal_item).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{ textAlign: 'right', marginTop: '10px', fontSize: '0.9rem' }}
            >
              <div>
                Subtotal: ${Number(cotizacionSeleccionada.subtotal).toFixed(2)}
              </div>
              <div>
                IVA (13%): ${Number(cotizacionSeleccionada.impuesto_iva).toFixed(2)}
              </div>
              <div
                style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#16a34a' }}
              >
                Total General: ${Number(cotizacionSeleccionada.total).toFixed(2)}
              </div>
            </div>

            <button
              onClick={() => handleProcesar(cotizacionSeleccionada.id_cotizacion)}
              disabled={procesando}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '15px',
                backgroundColor: procesando ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: procesando ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
              }}
            >
              {procesando
                ? 'Procesando FIFO en Bodega...'
                : '⚡ Ejecutar Despacho FIFO sobre Lotes'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            👈 Selecciona una cotización de la izquierda para ver los detalles y
            ejecutar la salida de bodega.
          </div>
        )}

        {/* ================================================================== */}
        {/* RESULTADO DEL DESPACHO */}
        {/* ================================================================== */}
        {resultadoDespacho && (
          <div
            style={{
              marginTop: '20px',
              padding: '15px',
              borderRadius: '6px',
              backgroundColor: resultadoDespacho.success ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${
                resultadoDespacho.success ? '#10b981' : '#ef4444'
              }`,
            }}
          >
            <h4
              style={{
                color: resultadoDespacho.success ? '#047857' : '#b91c1c',
                margin: '0 0 8px 0',
              }}
            >
              {resultadoDespacho.message}
            </h4>

            {resultadoDespacho.success && resultadoDespacho.id_orden && (
              <p
                style={{
                  fontSize: '0.85rem',
                  color: '#047857',
                  margin: 0,
                  fontWeight: 'bold',
                }}
              >
                📄 Orden de despacho generada: {resultadoDespacho.id_orden.slice(0, 8)}...
              </p>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* PICKING LIST (Lotes físicos a retirar) */}
        {/* ================================================================== */}
        {pickingList.length > 0 && (
          <div
            style={{
              marginTop: '20px',
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '2px dashed #f59e0b',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <h4 style={{ margin: 0, color: '#92400e' }}>
                📋 Picking List — Lotes Físicos a Retirar
              </h4>
              <button
                onClick={handleImprimirPicking}
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                🖨️ Imprimir
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#78350f', marginTop: 0 }}>
              Retira los siguientes lotes del anaquel, verificando el código y la
              fecha de vencimiento antes de empaquetar.
            </p>

            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#fef3c7',
                    textAlign: 'left',
                    borderBottom: '2px solid #f59e0b',
                  }}
                >
                  <th style={{ padding: '8px' }}>Producto</th>
                  <th style={{ padding: '8px' }}>Lote</th>
                  <th style={{ padding: '8px' }}>Vence</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>
                    Cantidad a Retirar
                  </th>
                </tr>
              </thead>
              <tbody>
                {pickingList.map((item) => (
                  <tr
                    key={item.id_despacho_detalle}
                    style={{ borderBottom: '1px solid #fde68a' }}
                  >
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                        {item.lotes?.productos?.nombre || '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {item.lotes?.productos?.item_code || ''}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        fontWeight: 'bold',
                        color: '#92400e',
                        fontFamily: 'monospace',
                      }}
                    >
                      {item.lotes?.codigo_lote || '—'}
                    </td>
                    <td style={{ padding: '8px', fontSize: '0.8rem' }}>
                      {item.lotes?.fecha_vencimiento
                        ? new Date(item.lotes.fecha_vencimiento).toLocaleDateString(
                            'es-SV',
                            { day: '2-digit', month: '2-digit', year: 'numeric' }
                          )
                        : '—'}
                    </td>
                    <td
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        color: '#16a34a',
                      }}
                    >
                      {item.cantidad_descontada}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                marginTop: '12px',
                fontSize: '0.75rem',
                color: '#78350f',
                borderTop: '1px solid #fde68a',
                paddingTop: '8px',
              }}
            >
              ✅ Total de lotes a retirar: <strong>{pickingList.length}</strong>
              {' · '}
              Total de unidades:{' '}
              <strong>
                {pickingList.reduce(
                  (sum, item) => sum + item.cantidad_descontada,
                  0
                )}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}