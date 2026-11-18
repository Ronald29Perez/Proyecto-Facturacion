// ============================================================================
// COMPONENTE: REPORTES E HISTORIAL (RESPONSIVE)
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Download, DollarSign, Package, Edit } from 'lucide-react';
import { ajustarStockLote } from '../../controllers/despachoController';
import { 
  generarPdfFactura, 
  generarPdfPickingList, 
  generarPdfInventario, 
  generarPdfHistorialCotizaciones,
  generarPdfHistorialDespachos,
  generarPdfHistorialFacturas 
} from '../../controllers/pdfController';
import { supabase } from '../../lib/supabase';

export default function HistorialReportes({ 
  cotizaciones = [], 
  despachos = [], 
  facturas = [], 
  inventario = [], 
  valorTotalBodega = 0, 
  totalCajas = 0,
  rolUsuario,
  onRefrescar
}: any) {
  
  const puedeVerCotizaciones = ['ADMINISTRADOR', 'GERENTE', 'VENDEDOR'].includes(rolUsuario);
  const puedeVerFacturas = ['ADMINISTRADOR', 'GERENTE', 'CAJERO'].includes(rolUsuario);
  const puedeVerDespachos = ['ADMINISTRADOR', 'GERENTE', 'BODEGA'].includes(rolUsuario);
  const puedeVerInventario = ['ADMINISTRADOR', 'GERENTE', 'BODEGA'].includes(rolUsuario);

  const [tab, setTab] = useState<'COT' | 'DES' | 'FAC' | 'INV'>(() => {
    if (rolUsuario === 'CAJERO') return 'FAC';
    if (rolUsuario === 'BODEGA') return 'INV';
    if (rolUsuario === 'VENDEDOR') return 'COT';
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

  const handleAjustarStock = async (item: any) => {
    const cantidadReal = prompt(`Ingresa la cantidad REAL de cajas para el lote ${item.codigo_lote}:`, item.cantidad_disponible.toString());
    if (cantidadReal === null) return; 
    
    const motivo = prompt('Motivo del ajuste (Ej: Producto dañado, Faltante, Conteo físico):', 'Conteo físico');
    if (motivo === null) return;
    
    const numReal = parseInt(cantidadReal);
    if (isNaN(numReal) || numReal < 0) return alert('Cantidad inválida');
    
    const res = await ajustarStockLote(item.id_lote, numReal, motivo);
    
    if (res.success) {
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

  // Clases reutilizables
  const btnTabClass = (isActive: boolean) => 
    `px-4 py-2 rounded-md font-bold text-xs whitespace-nowrap transition-colors ${
      isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
      
      {/* ENCABEZADO DEL REPORTE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="m-0 text-lg font-bold text-slate-800">Reportes e Historial</h3>
          <p className="text-xs text-slate-500 mt-1">Fecha: {new Date().toLocaleString()}</p>
        </div>
        
        <button 
          onClick={() => {
            if (tab === 'COT') generarPdfHistorialCotizaciones(cotizaciones);
            else if (tab === 'DES') generarPdfHistorialDespachos(despachos);
            else if (tab === 'FAC') generarPdfHistorialFacturas(facturas);
            else if (tab === 'INV') generarPdfInventario(inventario, valorTotalBodega);
          }} 
          className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-md flex justify-center items-center gap-2 text-sm transition-colors"
        >
          <Download size={16} /> 
          <span className="hidden sm:inline">Descargar PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>

      {/* PESTAÑAS CON SCROLL HORIZONTAL */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {puedeVerCotizaciones && (
          <button onClick={() => setTab('COT')} className={btnTabClass(tab === 'COT')}> Cotizaciones</button>
        )}
        {puedeVerDespachos && (
          <button onClick={() => setTab('DES')} className={btnTabClass(tab === 'DES')}>Despachos</button>
        )}
        {puedeVerFacturas && (
          <button onClick={() => setTab('FAC')} className={btnTabClass(tab === 'FAC')}>Facturas</button>
        )}
        {puedeVerInventario && (
          <button onClick={() => setTab('INV')} className={btnTabClass(tab === 'INV')}>Inventario</button>
        )}
      </div>

      {/* ================= TABLAS ================= */}
      <div className="w-full overflow-x-auto border border-slate-200 rounded-lg">
        
        {/* COTIZACIONES */}
        {tab === 'COT' && (
          <table className="w-full text-sm text-left min-w-[700px] whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">N° Cotización</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c: any) => (
                <tr key={c.id_cotizacion} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-bold text-sky-600">{c.numero_cotizacion}</td>
                  <td className="p-3 text-slate-500">{new Date(c.fecha_emision).toLocaleString()}</td>
                  <td className="p-3">{c.cliente_nombre} <span className="text-xs text-slate-400">({c.cliente_tipo})</span></td>
                  <td className="p-3 font-bold text-green-600">${Number(c.total).toFixed(2)}</td>
                  <td className="p-3"><BadgeEstado estado={c.estado} /></td>
                  <td className="p-3 text-center">
                    <button onClick={() => abrirDetalle(c, 'COT')} className="bg-sky-100 text-sky-700 hover:bg-sky-200 px-3 py-1.5 rounded text-xs font-bold transition-colors"> Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* DESPACHOS */}
        {tab === 'DES' && (
          <table className="w-full text-sm text-left min-w-[700px] whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">N° Orden</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Cotización</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {despachos.map((d: any) => (
                <tr key={d.id_orden} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-bold text-sky-600">{d.numero_orden}</td>
                  <td className="p-3 text-slate-500">{new Date(d.fecha_despacho).toLocaleString()}</td>
                  <td className="p-3">{d.cotizaciones?.numero_cotizacion}</td>
                  <td className="p-3">{d.cotizaciones?.cliente_nombre}</td>
                  <td className="p-3 font-bold">${Number(d.cotizaciones?.total || 0).toFixed(2)}</td>
                  <td className="p-3"><BadgeEstado estado={d.estado} /></td>
                  <td className="p-3 text-center">
                    <button onClick={() => abrirDetalle(d, 'DES')} className="bg-sky-100 text-sky-700 hover:bg-sky-200 px-3 py-1.5 rounded text-xs font-bold transition-colors"> Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* FACTURAS */}
        {tab === 'FAC' && (
          <table className="w-full text-sm text-left min-w-[700px] whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">N° Factura</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Total</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f: any) => (
                <tr key={f.id_factura} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-bold text-sky-600">{f.correlativo}</td>
                  <td className="p-3 text-slate-500">{new Date(f.fecha_emision).toLocaleString()}</td>
                  <td className="p-3">{f.cliente_nombre}</td>
                  <td className="p-3 text-slate-500">{f.tipo_comprobante.replace(/_/g, ' ')}</td>
                  <td className="p-3 font-bold text-green-600">${Number(f.total).toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => abrirDetalle(f, 'FAC')} className="bg-sky-100 text-sky-700 hover:bg-sky-200 px-3 py-1.5 rounded text-xs font-bold transition-colors"> Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* INVENTARIO */}
        {tab === 'INV' && (
          <div className="p-4 bg-white">
            {/* Tarjetas de Totales (Arriba) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0"><DollarSign size={24} /></div>
                <div>
                  <p className="m-0 text-xs text-green-800 font-bold uppercase">Valor Bodega</p>
                  <h2 className="m-0 text-2xl text-green-700">${valorTotalBodega.toFixed(2)}</h2>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full text-sky-600 shrink-0"><Package size={24} /></div>
                <div>
                  <p className="m-0 text-xs text-blue-900 font-bold uppercase">Cajas en Stock</p>
                  <h2 className="m-0 text-2xl text-sky-600">{totalCajas}</h2>
                </div>
              </div>
            </div>

            {/* Tabla de Inventario */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left min-w-[900px] whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Lote</th>
                    <th className="p-3">Vencimiento</th>
                    <th className="p-3">Días p/ Vencer</th>
                    <th className="p-3 text-center">Cajas</th>
                    <th className="p-3 text-center">Unid. Sueltas</th>
                    <th className="p-3 text-center">Total Und</th>
                    <th className="p-3">Valor Total</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((item: any, index: number) => {
                    const esRojo = item.dias_para_vencer < 0;
                    const esAmarillo = item.dias_para_vencer >= 0 && item.dias_para_vencer <= 7;
                    const cajasCerradas = item.cajas_cerradas || 0;
                    const unidadesSueltas = item.unidades_sueltas || 0;
                    const totalUnidades = (cajasCerradas * (item.productos?.unidades_por_caja || 1)) + unidadesSueltas;
                    
                    return (
                      <tr key={index} className={`border-b border-slate-100 hover:bg-slate-50 ${esRojo ? 'bg-red-50/50' : esAmarillo ? 'bg-amber-50/50' : ''}`}>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{item.productos?.nombre}</div>
                          <div className="text-[10px] text-slate-500">{item.productos?.item_code}</div>
                        </td>
                        <td className="p-3 font-mono text-xs">{item.codigo_lote}</td>
                        <td className="p-3 text-slate-600">{new Date(item.fecha_vencimiento).toLocaleDateString()}</td>
                        <td className={`p-3 font-bold ${esRojo ? 'text-red-600' : esAmarillo ? 'text-amber-600' : 'text-green-600'}`}>
                          {item.dias_para_vencer} días
                        </td>
                        <td className="p-3 text-center font-bold text-sky-600">{cajasCerradas} <span className="text-[10px] font-normal text-slate-500">cj</span></td>
                        <td className="p-3 text-center font-bold text-amber-500">{unidadesSueltas} <span className="text-[10px] font-normal text-slate-500">und</span></td>
                        <td className="p-3 text-center font-bold">{totalUnidades}</td>
                        <td className="p-3 font-bold text-sky-600">${item.valor_total.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleAjustarStock(item)} className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors">
                            <Edit size={12} /> Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL DE DETALLE (RESPONSIVE) */}
      {/* ==================================================================== */}
      {detalleModal && tipoModal && (
        <div className="fixed inset-0 bg-slate-900/70 flex justify-center items-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-5 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="m-0 text-lg font-bold text-slate-800">
                {tipoModal === 'COT' && ' Detalle de Cotización'}
                {tipoModal === 'DES' && ' Detalle de Despacho'}
                {tipoModal === 'FAC' && ' Detalle de Factura'}
              </h3>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-red-500 text-2xl font-bold leading-none">✕</button>
            </div>

            <div className="text-sm text-slate-700 overflow-y-auto pr-1">
              
              {/* COTIZACION */}
              {tipoModal === 'COT' && (
                <>
                  <p><strong>N°:</strong> {detalleModal.numero_cotizacion}</p>
                  <p><strong>Cliente:</strong> {detalleModal.cliente_nombre} ({detalleModal.cliente_tipo})</p>
                  <p><strong>Fecha:</strong> {new Date(detalleModal.fecha_emision).toLocaleString()}</p>
                  <p><strong>Estado:</strong> {detalleModal.estado}</p>
                  <p><strong>Entrega:</strong> {detalleModal.datos_entrega || 'No especificados'}</p>
                  
                  <h4 className="mt-5 mb-2 font-bold text-slate-800 border-b pb-1">Productos Solicitados</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[400px]">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr><th className="p-2">Producto</th><th className="p-2">Cant.</th><th className="p-2">Precio</th><th className="p-2">Subtotal</th></tr>
                      </thead>
                      <tbody>
                        {detalleModal.cotizacion_detalles?.map((d: any) => (
                          <tr key={d.id_detalle} className="border-b border-slate-100">
                            <td className="p-2">{d.nombre_producto}</td>
                            <td className="p-2">{d.cantidad} {d.unidad_medida}</td>
                            <td className="p-2">${Number(d.precio_unitario).toFixed(2)}</td>
                            <td className="p-2 font-bold">${Number(d.subtotal_item).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
               
              {/* DESPACHO */}
              {tipoModal === 'DES' && (
                <>
                  <p><strong>Orden:</strong> {detalleModal.numero_orden}</p>
                  <p><strong>Cotización:</strong> {detalleModal.cotizaciones?.numero_cotizacion}</p>
                  <p><strong>Cliente:</strong> {detalleModal.cotizaciones?.cliente_nombre}</p>
                  <p><strong>Fecha:</strong> {new Date(detalleModal.fecha_despacho).toLocaleString()}</p>
                  <p><strong>Estado:</strong> {detalleModal.estado}</p>
                  
                  <h4 className="mt-5 mb-2 font-bold text-slate-800 border-b pb-1"> Lotes Retirados (FIFO)</h4>
                  
                  {detalleModal.despacho_lotes_detalles && detalleModal.despacho_lotes_detalles.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left min-w-[400px]">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr><th className="p-2">Producto</th><th className="p-2">Lote</th><th className="p-2">Vence</th><th className="p-2">Cant.</th></tr>
                        </thead>
                        <tbody>
                          {detalleModal.despacho_lotes_detalles.map((d: any, index: number) => (
                            <tr key={index} className="border-b border-slate-100">
                              <td className="p-2">{d.lotes?.productos?.nombre || 'Producto'}</td>
                              <td className="p-2 font-mono text-[10px]">{d.lotes?.codigo_lote}</td>
                              <td className="p-2">{d.lotes?.fecha_vencimiento}</td>
                              <td className="p-2 font-bold text-green-600">{d.cantidad_descontada}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No hay registros de lotes para este despacho.</p>
                  )}
                </>
              )}

              {/* FACTURA */}
              {tipoModal === 'FAC' && (
                <>
                  <p><strong>Correlativo:</strong> {detalleModal.correlativo}</p>
                  <p><strong>Cliente:</strong> {detalleModal.cliente_nombre}</p>
                  <p><strong>Tipo:</strong> {detalleModal.tipo_comprobante.replace(/_/g, ' ')}</p>
                  <p><strong>Condición:</strong> {detalleModal.condicion_pago}</p>
                  <p><strong>Método:</strong> {detalleModal.metodo_pago || 'No registrado'}</p>
                  <p><strong>Fecha:</strong> {new Date(detalleModal.fecha_emision).toLocaleString()}</p>
                  
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex justify-between mb-1 text-slate-600"><span>Subtotal:</span><span>${Number(detalleModal.subtotal).toFixed(2)}</span></div>
                    <div className="flex justify-between mb-1 text-slate-600"><span>IVA (13%):</span><span>${Number(detalleModal.impuesto_iva).toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg border-t border-slate-300 pt-2 mt-2"><span>Total:</span><span className="text-green-600">${Number(detalleModal.total).toFixed(2)}</span></div>
                  </div>
                </>
              )}
            </div>

            {/* BOTONES DE ACCIÓN DEL MODAL */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
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
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex justify-center items-center gap-2 transition-colors"
                >
                  <Download size={16} /> Descargar PDF
                </button>
              )}
              
              <button onClick={cerrarModal} className="w-full sm:w-auto sm:ml-auto bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-md transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente para las píldoras de estado
function BadgeEstado({ estado }: { estado: string }) {
  let colorClasses = 'bg-amber-100 text-amber-700'; // Pendiente por defecto
  if (estado.includes('FACTURADO') || estado === 'PAGADO') colorClasses = 'bg-green-100 text-green-700';
  if (estado.includes('DESPACHO')) colorClasses = 'bg-sky-100 text-sky-700';

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${colorClasses}`}>
      {estado}
    </span>
  );
}