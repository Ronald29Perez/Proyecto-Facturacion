// ============================================================================
// COMPONENTE: REPORTES E HISTORIAL (CON MODALES DE DETALLE Y DESCARGA PDF)
// Ubicación: components/reportes/HistorialReportes.tsx
// BD: v3.3 — Inventario con Ajuste de Stock
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Download, DollarSign, Package, Edit } from 'lucide-react';
import { ajustarStockLote } from '../../controllers/despachoController';
import { generarPdfFactura, generarPdfPickingList, generarPdfInventario,  generarPdfHistorialCotizaciones, // 🔥 NUEVO
  generarPdfHistorialDespachos,    // 🔥 NUEVO
  generarPdfHistorialFacturas   } from '../../controllers/pdfController';
import { supabase } from '../../lib/supabase';

export default function HistorialReportes({ 
  cotizaciones, 
  despachos, 
  facturas, 
  inventario, 
  valorTotalBodega, 
  totalCajas,
  rolUsuario,
  onRefrescar // 🔥 Función para recargar datos

}: any) {
    // 🔥 Lógica de permisos dentro del reporte
  const puedeVerCotizaciones = ['ADMINISTRADOR', 'GERENTE', 'VENDEDOR'].includes(rolUsuario);
  const puedeVerFacturas = ['ADMINISTRADOR', 'GERENTE', 'CAJERO'].includes(rolUsuario);
  const puedeVerDespachos = ['ADMINISTRADOR', 'GERENTE', 'BODEGA'].includes(rolUsuario);
  const puedeVerInventario = ['ADMINISTRADOR', 'GERENTE', 'BODEGA'].includes(rolUsuario);

    // Establecer la pestaña por defecto según el rol
const [tab, setTab] = useState<'COT' | 'DES' | 'FAC' | 'INV'>(() => {
  // Si es cajero, empieza en Facturas
  if (rolUsuario === 'CAJERO') return 'FAC';
  // Si es bodega, empieza en Inventario
  if (rolUsuario === 'BODEGA') return 'INV';
  // Si es vendedor, empieza en Cotizaciones
  if (rolUsuario === 'VENDEDOR') return 'COT';
  // Admin y Gerente empiezan en Cotizaciones
  return 'COT';
});
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

  // 🔥 FUNCIÓN PARA AJUSTAR STOCK
  const handleAjustarStock = async (item: any) => {
    const cantidadReal = prompt(`Ingresa la cantidad REAL de cajas para el lote ${item.codigo_lote}:`, item.cantidad_disponible.toString());
    if (cantidadReal === null) return; 
    
    const motivo = prompt('Motivo del ajuste (Ej: Producto dañado, Faltante, Conteo físico):', 'Conteo físico');
    if (motivo === null) return;
    
    const numReal = parseInt(cantidadReal);
    if (isNaN(numReal) || numReal < 0) return alert('Cantidad inválida');
    
    const res = await ajustarStockLote(item.id_lote, numReal, motivo);
    
    if (res.success) {
      // Guardar el historial del ajuste
      await supabase.from('ajustes_inventario').insert([{
        id_lote: item.id_lote,
        cantidad_anterior: item.cantidad_disponible,
        cantidad_nueva: numReal,
        diferencia: numReal - item.cantidad_disponible,
        motivo: motivo
      }]);
    }
    
    alert(res.message);
    if (res.success && onRefrescar) onRefrescar();
  };

  return (
    <div className="imprimible" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
      
           {/* ENCABEZADO DEL REPORTE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>📊 Reportes e Historial - AgroLactec</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Fecha de impresión: {new Date().toLocaleString()}
          </p>
        </div>
        
               {/* 🔥 BOTÓN DINÁMICO SEGÚN LA PESTAÑA */}
        <button 
          onClick={() => {
            if (tab === 'COT') generarPdfHistorialCotizaciones(cotizaciones);
            else if (tab === 'DES') generarPdfHistorialDespachos(despachos);
            else if (tab === 'FAC') generarPdfHistorialFacturas(facturas);
            else if (tab === 'INV') generarPdfInventario(inventario, valorTotalBodega);
          }} 
          className="no-imprimir"
          style={{ 
            backgroundColor: '#0f172a', 
            color: '#fff', 
            border: 'none', 
            padding: '10px 16px', 
            borderRadius: '6px', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <Download size={18} /> 
          {tab === 'COT' && 'Descargar Historial PDF'}
          {tab === 'DES' && 'Descargar Despachos PDF'}
          {tab === 'FAC' && 'Descargar Facturas PDF'}
          {tab === 'INV' && 'Descargar Inventario PDF'}
        </button>
      </div>

      {/* Pestañas */}
    <div className="no-imprimir" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
    {puedeVerCotizaciones && (
      <button onClick={() => setTab('COT')} style={tabBtn(tab === 'COT')}>📄 Cotizaciones ({cotizaciones.length})</button>
    )}
    {puedeVerDespachos && (
      <button onClick={() => setTab('DES')} style={tabBtn(tab === 'DES')}>📦 Despachos ({despachos.length})</button>
    )}
    {puedeVerFacturas && (
      <button onClick={() => setTab('FAC')} style={tabBtn(tab === 'FAC')}>🧾 Facturas ({facturas.length})</button>
    )}
    {puedeVerInventario && (
      <button onClick={() => setTab('INV')} style={tabBtn(tab === 'INV')}>📦 Inventario Valorizado</button>
    )}
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

            {/* ================= TABLA INVENTARIO VALORIZADO ================= */}
      {tab === 'INV' && (
        <div>
          {/* Tarjetas de Totales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ backgroundColor: '#dcfce7', padding: '15px', borderRadius: '50%', color: '#16a34a' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534', fontWeight: 'bold' }}>Valor Total en Bodega</p>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#15803d' }}>${valorTotalBodega.toFixed(2)}</h2>
              </div>
            </div>
            <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ backgroundColor: '#dbeafe', padding: '15px', borderRadius: '50%', color: '#0284c7' }}>
                <Package size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e3a8a', fontWeight: 'bold' }}>Cajas en Stock</p>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0284c7' }}>{totalCajas}</h2>
              </div>
            </div>
          </div>

          {/* Tabla de Inventario */}
          <table style={tableStyle}>
            <thead>
              <tr style={thStyle}>
                <th style={tdStyle}>Producto</th>
                <th style={tdStyle}>Lote</th>
                <th style={tdStyle}>Vencimiento</th>
                <th style={tdStyle}>Días p/ Vencer</th>
                <th style={tdStyle}>Cajas Cerradas</th>
                <th style={tdStyle}>Unidades Sueltas</th>
                <th style={tdStyle}>Total Unidades</th>
                <th style={tdStyle}>Valor Total</th>
                <th className="no-imprimir" style={{ ...tdStyle, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            
            <tbody>
              {inventario.map((item: any, index: number) => {
                const esRojo = item.dias_para_vencer < 0;
                const esAmarillo = item.dias_para_vencer >= 0 && item.dias_para_vencer <= 7;
                
                // Cálculo de unidades totales
                const cajasCerradas = item.cajas_cerradas || 0;
                const unidadesSueltas = item.unidades_sueltas || 0;
                const totalUnidades = (cajasCerradas * (item.productos?.unidades_por_caja || 1)) + unidadesSueltas;
                
                return (
                  <tr key={index} style={{ ...trStyle, backgroundColor: esRojo ? '#fef2f2' : esAmarillo ? '#fffbeb' : '#fff' }}>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                      {item.productos?.nombre}
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                        {item.productos?.item_code}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{item.codigo_lote}</td>
                    <td style={tdStyle}>{new Date(item.fecha_vencimiento).toLocaleDateString()}</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: esRojo ? '#b91c1c' : esAmarillo ? '#b45309' : '#16a34a' }}>
                      {item.dias_para_vencer} días
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: '#0284c7' }}>
                      {cajasCerradas} <span style={{fontSize: '0.7rem', fontWeight: 'normal'}}>cj</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: '#f59e0b' }}>
                      {unidadesSueltas} <span style={{fontSize: '0.7rem', fontWeight: 'normal'}}>und</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>
                      {totalUnidades}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#0284c7' }}>
                      ${item.valor_total.toFixed(2)}
                    </td>
                    <td className="no-imprimir" style={{ ...tdStyle, textAlign: 'center' }}>
                      <button 
                        onClick={() => handleAjustarStock(item)}
                        style={{ 
                          backgroundColor: '#f59e0b', color: '#fff', border: 'none', 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', 
                          cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto'
                        }}
                      >
                        <Edit size={12} /> Ajustar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DE DETALLE CON BOTÓN DE DESCARGA */}
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

            {/* 🔥 BOTÓN DE DESCARGA */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {(tipoModal === 'FAC' || tipoModal === 'DES') && (
                <button
                  onClick={() => {
                    if (tipoModal === 'FAC') {
                      generarPdfFactura(detalleModal, detalleModal.items_factura || []);
                    } else {
                      generarPdfPickingList(
                        {
                          numero_orden: detalleModal.numero_orden,
                          fecha_despacho: detalleModal.fecha_despacho,
                          cliente_nombre: detalleModal.cotizaciones?.cliente_nombre,
                          numero_cotizacion: detalleModal.cotizaciones?.numero_cotizacion,
                        },
                        detalleModal.despacho_lotes_detalles || []
                      );
                    }
                  }}
                  style={{
                    backgroundColor: '#2563eb', color: '#fff', border: 'none',
                    padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Download size={18} /> Descargar PDF
                </button>
              )}
              
              <button onClick={cerrarModal} style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto' }}>
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