// ============================================================================
// COMPONENTE: GESTIÓN DE ÓRDENES DE DESPACHO Y MOTOR FIFO
// Ubicación: components/despacho/OrdenDespacho.tsx
// BD: v3.4 — Impresión limpia con react-to-print
// ============================================================================

'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import { 
  Inbox, Package, Zap, Printer, CheckCircle2, FileText, MousePointerClick, Box 
} from 'lucide-react';
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

  // 🔥 REFERENCIA Y FUNCIÓN DE IMPRESIÓN
  const pickingListRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: pickingListRef,
    documentTitle: `PickingList_AgroLactec_${resultadoDespacho?.id_orden?.slice(0, 8) || 'Nuevo'}`,
  });

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
      if (respuesta.id_orden) {
        const lista = await obtenerPickingList(respuesta.id_orden);
        setPickingList(lista as unknown as PickingItem[]);
        // Ya NO hay window.print() automático aquí.
      }
    }
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
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
          <Inbox size={20} color="#0284c7" />
          Cotizaciones Recibidas ({cotizacionesPendientes.length})
        </h3>
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
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Inbox size={32} color="#cbd5e1" />
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
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
              <Package size={22} color="#0284c7" />
              Procesar Orden de Despacho: {cotizacionSeleccionada.numero_cotizacion}
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

            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Box size={18} color="#475569" />
              Ítems del Pedido:
            </h4>
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
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Zap size={18} />
              {procesando
                ? 'Procesando FIFO en Bodega...'
                : 'Ejecutar Despacho FIFO sobre Lotes'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <MousePointerClick size={40} color="#cbd5e1" />
            <p>Selecciona una cotización de la izquierda para ver los detalles y ejecutar la salida de bodega.</p>
          </div>
        )}

        {/* ================================================================== */}
        {/* RESULTADO DEL DESPACHO */}
        {/* ================================================================== */}
        {resultadoDespacho && !pickingList.length && (
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} />
              {resultadoDespacho.message}
            </h4>
          </div>
        )}

        {/* ================================================================== */}
        {/* PICKING LIST (CON REFERENCIA PARA IMPRIMIR) */}
        {/* ================================================================== */}
        {pickingList.length > 0 && (
          <>
            {/* 🔥 REFERENCIA AQUI */}
            <div 
              ref={pickingListRef}
              style={{
                backgroundColor: '#ffffff',
                padding: '40px',
                color: '#333',
                fontFamily: 'Arial, sans-serif',
                marginTop: '20px'
              }}
            >
              {/* CABECERA (Como Orden de Compra) */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '3px solid #f59e0b', 
                paddingBottom: '20px',
                marginBottom: '20px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '150px', height: '60px', position: 'relative' }}>
                    <Image src="/img/logo-agrolactec.png" alt="Logo" fill style={{ objectFit: 'contain', objectPosition: 'left' }} />
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#92400e' }}>ORDEN DE DESPACHO</h1>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>AgroLactec S.A. de C.V.</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#92400e' }}>PICKING LIST</h2>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1rem' }}>N° Orden: {resultadoDespacho?.id_orden?.slice(0,8)}...</p>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Fecha: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* DATOS DE ENTREGA (Caja Amarilla) */}
              <div style={{ display: 'flex', gap: '40px', marginBottom: '30px', backgroundColor: '#fef3c7', padding: '15px', borderRadius: '6px', border: '1px solid #fcd34d' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#92400e', fontSize: '0.85rem' }}>CLIENTE:</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{cotizacionSeleccionada?.cliente_nombre || 'Cliente'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#92400e', fontSize: '0.85rem' }}>PEDIDO REF:</p>
                  <p style={{ margin: 0 }}>{cotizacionSeleccionada?.numero_cotizacion || '—'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#92400e', fontSize: '0.85rem' }}>TIPO:</p>
                  <p style={{ margin: 0 }}>{cotizacionSeleccionada?.cliente_tipo || '—'}</p>
                </div>
              </div>

              {/* TABLA DE PICKING LIST */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '30px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f59e0b', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '10px', border: '1px solid #f59e0b' }}>Producto</th>
                    <th style={{ padding: '10px', border: '1px solid #f59e0b' }}>Código Lote</th>
                    <th style={{ padding: '10px', border: '1px solid #f59e0b' }}>Vencimiento</th>
                    <th style={{ padding: '10px', border: '1px solid #f59e0b', textAlign: 'center' }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {pickingList.map((item) => (
                    <tr key={item.id_despacho_detalle}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 'bold' }}>{item.lotes?.productos?.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.lotes?.productos?.item_code}</div>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.lotes?.codigo_lote}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                        {item.lotes?.fecha_vencimiento ? new Date(item.lotes.fecha_vencimiento).toLocaleDateString('es-SV') : '—'}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', color: '#16a34a', fontSize: '1.1rem' }}>{item.cantidad_descontada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* RESUMEN Y FIRMAS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  <p style={{ margin: 0 }}><strong>Total de lotes:</strong> {pickingList.length}</p>
                  <p style={{ margin: 0 }}><strong>Total de unidades:</strong> {pickingList.reduce((sum, item) => sum + item.cantidad_descontada, 0)}</p>
                </div>
                <div style={{ display: 'flex', gap: '40px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #333', width: '200px', paddingTop: '5px', fontSize: '0.8rem' }}>Entregado por Bodega</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #333', width: '200px', paddingTop: '5px', fontSize: '0.8rem' }}>Recibido por Cliente</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🔥 BOTÓN DE IMPRESIÓN (Fuera de la ref) */}
            <button 
              onClick={() => handlePrint()} 
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '20px',
                backgroundColor: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Printer size={18} />
              Imprimir Picking List
            </button>
          </>
        )}
      </div>
    </div>
  );
}