// ============================================================================
// COMPONENTE: REPORTES E HISTORIAL (CON MODALES DE DETALLE)
// Ubicación: components/reportes/HistorialReportes.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';

export default function HistorialReportes({ cotizaciones, despachos, facturas }: any) {
  const [tab, setTab] = useState<'COT' | 'DES' | 'FAC'>('COT');
  
  // Estado para el modal
  const [detalleModal, setDetalleModal] = useState<any | null>(null);
  const [tipoModal, setTipoModal] = useState<'COT' | 'DES' | 'FAC' | null>(null);

  const abrirDetalle = (item: any, tipo: 'COT' | 'DES' | 'FAC') => {
    setDetalleModal(item);
    setTipoModal(tipo);
  };

  const cerrarModal = () => {
    setDetalleModal(null);
    setTipoModal(null);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="imprimible" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
      
      {/* ENCABEZADO DEL REPORTE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>📊 Reportes e Historial - AgroLactec</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Fecha de impresión: {new Date().toLocaleString()}
          </p>
        </div>
        <button 
          onClick={handleImprimir} 
          className="no-imprimir"
          style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🖨️ Imprimir Reporte
        </button>
      </div>

      {/* Pestañas */}
      <div className="no-imprimir" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button onClick={() => setTab('COT')} style={tabBtn(tab === 'COT')}>📄 Cotizaciones ({cotizaciones.length})</button>
        <button onClick={() => setTab('DES')} style={tabBtn(tab === 'DES')}>📦 Despachos ({despachos.length})</button>
        <button onClick={() => setTab('FAC')} style={tabBtn(tab === 'FAC')}>🧾 Facturas ({facturas.length})</button>
      </div>

      {/* ================= TABLA COTIZACIONES ================= */}
      {tab === 'COT' && (
        <table style={tableStyle}>
          <thead>
            <tr style={thStyle}>
              <th style={tdStyle}>N° Cotización</th>
              <th style={tdStyle}>Fecha</th>
              <th style={tdStyle}>Cliente</th>
              <th style={tdStyle}>Total</th>
              <th style={tdStyle}>Estado</th>
              <th className="no-imprimir" style={{ ...tdStyle, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.map((c: any) => (
              <tr key={c.id_cotizacion} style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{c.numero_cotizacion}</td>
                <td style={tdStyle}>{new Date(c.fecha_emision).toLocaleString()}</td>
                <td style={tdStyle}>{c.cliente_nombre} <span style={{fontSize: '0.75rem', color: '#64748b'}}>({c.cliente_tipo})</span></td>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#16a34a' }}>${Number(c.total).toFixed(2)}</td>
                <td style={tdStyle}><span style={badge(c.estado)}>{c.estado}</span></td>
                <td className="no-imprimir" style={{ ...tdStyle, textAlign: 'center' }}>
                  <button onClick={() => abrirDetalle(c, 'COT')} style={btnAccionStyle}>
                    👁️ Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= TABLA DESPACHOS ================= */}
      {tab === 'DES' && (
        <table style={tableStyle}>
          <thead>
            <tr style={thStyle}>
              <th style={tdStyle}>N° Orden</th>
              <th style={tdStyle}>Fecha Despacho</th>
              <th style={tdStyle}>Cotización</th>
              <th style={tdStyle}>Cliente</th>
              <th style={tdStyle}>Total</th>
              <th style={tdStyle}>Estado</th>
              <th className="no-imprimir" style={{ ...tdStyle, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {despachos.map((d: any) => (
              <tr key={d.id_orden} style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{d.numero_orden}</td>
                <td style={tdStyle}>{new Date(d.fecha_despacho).toLocaleString()}</td>
                <td style={tdStyle}>{d.cotizaciones?.numero_cotizacion}</td>
                <td style={tdStyle}>{d.cotizaciones?.cliente_nombre}</td>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>${Number(d.cotizaciones?.total || 0).toFixed(2)}</td>
                <td style={tdStyle}><span style={badge(d.estado)}>{d.estado}</span></td>
                <td className="no-imprimir" style={{ ...tdStyle, textAlign: 'center' }}>
                  <button onClick={() => abrirDetalle(d, 'DES')} style={btnAccionStyle}>
                    👁️ Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= TABLA FACTURAS ================= */}
      {tab === 'FAC' && (
        <table style={tableStyle}>
          <thead>
            <tr style={thStyle}>
              <th style={tdStyle}>N° Factura</th>
              <th style={tdStyle}>Fecha</th>
              <th style={tdStyle}>Cliente</th>
              <th style={tdStyle}>Tipo</th>
              <th style={tdStyle}>Total</th>
              <th className="no-imprimir" style={{ ...tdStyle, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f: any) => (
              <tr key={f.id_factura} style={trStyle}>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{f.correlativo}</td>
                <td style={tdStyle}>{new Date(f.fecha_emision).toLocaleString()}</td>
                <td style={tdStyle}>{f.cliente_nombre}</td>
                <td style={tdStyle}>{f.tipo_comprobante.replace(/_/g, ' ')}</td>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#16a34a' }}>${Number(f.total).toFixed(2)}</td>
                <td className="no-imprimir" style={{ ...tdStyle, textAlign: 'center' }}>
                  <button onClick={() => abrirDetalle(f, 'FAC')} style={btnAccionStyle}>
                    👁️ Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ==================================================================== */}
      {/* MODAL DE DETALLE (Igual que antes) */}
      {/* ==================================================================== */}
      {detalleModal && tipoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>
                {tipoModal === 'COT' && '📄 Detalle de Cotización'}
                {tipoModal === 'DES' && '📦 Detalle de Despacho'}
                {tipoModal === 'FAC' && '🧾 Detalle de Factura'}
              </h3>
              <button onClick={cerrarModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#334155' }}>
              {tipoModal === 'COT' && (
                <>
                  <p><strong>N°:</strong> {detalleModal.numero_cotizacion}</p>
                  <p><strong>Cliente:</strong> {detalleModal.cliente_nombre} ({detalleModal.cliente_tipo})</p>
                  <p><strong>Fecha:</strong> {new Date(detalleModal.fecha_emision).toLocaleString()}</p>
                  <p><strong>Estado:</strong> {detalleModal.estado}</p>
                  <p><strong>Datos de Entrega:</strong> {detalleModal.datos_entrega || 'No especificados'}</p>
                  
                  <h4 style={{ marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Productos Solicitados</h4>
                  <table style={{ ...tableStyle, marginTop: '10px' }}>
                    <thead>
                      <tr style={thStyle}>
                        <th style={tdStyle}>Producto</th>
                        <th style={tdStyle}>Cant.</th>
                        <th style={tdStyle}>Precio</th>
                        <th style={tdStyle}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleModal.cotizacion_detalles?.map((d: any) => (
                        <tr key={d.id_detalle} style={trStyle}>
                          <td style={tdStyle}>{d.nombre_producto}</td>
                          <td style={tdStyle}>{d.cantidad} {d.unidad_medida}</td>
                          <td style={tdStyle}>${Number(d.precio_unitario).toFixed(2)}</td>
                          <td style={tdStyle}>${Number(d.subtotal_item).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
               
               {tipoModal === 'DES' && (
  <>
                    <p><strong>Orden:</strong> {detalleModal.numero_orden}</p>
                    <p><strong>Cotización Vinculada:</strong> {detalleModal.cotizaciones?.numero_cotizacion}</p>
                    <p><strong>Cliente:</strong> {detalleModal.cotizaciones?.cliente_nombre}</p>
                    <p><strong>Fecha de Despacho:</strong> {new Date(detalleModal.fecha_despacho).toLocaleString()}</p>
                    <p><strong>Estado:</strong> {detalleModal.estado}</p>
                    
                    {/* 🔥 NUEVA TABLA DE PICKING LIST */}
                    <h4 style={{ marginTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>
                    📋 Lotes Físicos Retirados (FIFO)
                    </h4>
                    
                    {detalleModal.despacho_lotes_detalles && detalleModal.despacho_lotes_detalles.length > 0 ? (
                    <table style={{ ...tableStyle, marginTop: '10px' }}>
                        <thead>
                        <tr style={thStyle}>
                            <th style={tdStyle}>Producto</th>
                            <th style={tdStyle}>Lote</th>
                            <th style={tdStyle}>Vence</th>
                            <th style={tdStyle}>Cant. Retirada</th>
                        </tr>
                        </thead>
                        <tbody>
                        {detalleModal.despacho_lotes_detalles.map((d: any, index: number) => (
                            <tr key={index} style={trStyle}>
                            <td style={tdStyle}>{d.lotes?.productos?.nombre || 'Producto'}</td>
                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 'bold' }}>{d.lotes?.codigo_lote}</td>
                            <td style={tdStyle}>{d.lotes?.fecha_vencimiento}</td>
                            <td style={{ ...tdStyle, fontWeight: 'bold', color: '#16a34a' }}>{d.cantidad_descontada}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    ) : (
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No hay registros de lotes para este despacho.</p>
                    )}
                </>
                )}

              {tipoModal === 'FAC' && (
                <>
                  <p><strong>Correlativo:</strong> {detalleModal.correlativo}</p>
                  <p><strong>Cliente:</strong> {detalleModal.cliente_nombre}</p>
                  <p><strong>Tipo:</strong> {detalleModal.tipo_comprobante.replace(/_/g, ' ')}</p>
                  <p><strong>Condición de Pago:</strong> {detalleModal.condicion_pago}</p>
                  <p><strong>Método de Pago:</strong> {detalleModal.metodo_pago || 'No registrado'}</p>
                  <p><strong>Fecha:</strong> {new Date(detalleModal.fecha_emision).toLocaleString()}</p>
                  
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>Subtotal:</span>
                      <span>${Number(detalleModal.subtotal).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>IVA (13%):</span>
                      <span>${Number(detalleModal.impuesto_iva).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', borderTop: '1px solid #cbd5e1', paddingTop: '5px', marginTop: '5px' }}>
                      <span>Total:</span>
                      <span>${Number(detalleModal.total).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ textAlign: 'right', marginTop: '24px' }}>
              <button onClick={cerrarModal} style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Estilos rápidos
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: '0.85rem',
  backgroundColor: active ? '#2563eb' : '#f1f5f9', color: active ? '#fff' : '#64748b',
});
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' };
const thStyle: React.CSSProperties = { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' };
const tdStyle: React.CSSProperties = { padding: '10px' };
const trStyle: React.CSSProperties = { borderBottom: '1px solid #f1f5f9' };
const badge = (estado: string): React.CSSProperties => ({
  padding: '3px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold',
  backgroundColor: estado === 'PENDIENTE' ? '#fef3c7' : estado.includes('FACTURADO') ? '#dcfce7' : '#e0f2fe',
  color: estado === 'PENDIENTE' ? '#b45309' : estado.includes('FACTURADO') ? '#15803d' : '#0369a1',
});

// 🔥 NUEVO ESTILO PARA EL BOTÓN DE ACCIÓN
const btnAccionStyle: React.CSSProperties = {
  backgroundColor: '#e0f2fe',
  color: '#0284c7',
  border: '1px solid #bae6fd',
  padding: '4px 10px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  cursor: 'pointer',
};