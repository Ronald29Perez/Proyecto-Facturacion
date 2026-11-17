// ============================================================================
// COMPONENTE: MÓDULO DE FACTURACIÓN, PAGOS Y COMPROBANTES FISCALES (RESPONSIVE)
// Ubicación: components/facturacion/ComprobanteFiscal.tsx
// ============================================================================

'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import { 
  FileText, Eye, CreditCard, Printer, SearchX 
} from 'lucide-react';
import { OrdenDespachoEntity, CuentaBancariaEntity } from '../../models/agrolactec';

interface Props {
  ordenesPorFacturar: OrdenDespachoEntity[];
  cuentasBancarias: CuentaBancariaEntity[];
  onGenerarComprobante: (datos: {
    id_orden: string;
    tipo_comprobante: 'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL';
    condicion_pago: 'CONTADO' | 'CREDITO_15_DIAS' | 'CREDITO_30_DIAS';
    metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';
    id_cuenta_bancaria?: string;
    numero_comprobante?: string;
  }) => Promise<{ success: boolean; message: string; correlativo?: string }>;
}

export default function ComprobanteFiscal({
  ordenesPorFacturar,
  cuentasBancarias,
  onGenerarComprobante,
}: Props) {
  const [ordenSel, setOrdenSel] = useState<OrdenDespachoEntity | null>(null);
  const [tipoComprobante, setTipoComprobante] = useState<'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL'>('FACTURA_CONSUMIDOR_FINAL');
  const [condicionPago, setCondicionPago] = useState<'CONTADO' | 'CREDITO_15_DIAS' | 'CREDITO_30_DIAS'>('CONTADO');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'>('TRANSFERENCIA');
  const [idCuentaSel, setIdCuentaSel] = useState('');
  const [numComprobanteBanco, setNumComprobanteBanco] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [documentoEmitido, setDocumentoEmitido] = useState<any | null>(null);

  const componenteFacturaRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componenteFacturaRef,
    documentTitle: `Factura_AgroLactec_${documentoEmitido?.numero || 'Nueva'}`,
  });

  const montoTotal = ordenSel?.cotizaciones?.total ?? ordenSel?.total_despachado ?? 0;
  const subtotalNeto = parseFloat((montoTotal / 1.13).toFixed(2));
  const iva13 = parseFloat((montoTotal - subtotalNeto).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenSel) return alert('Selecciona una orden para facturar.');

    if (metodoPago === 'TRANSFERENCIA' && (!idCuentaSel || !numComprobanteBanco.trim())) {
      return alert('Selecciona la cuenta bancaria de destino e ingresa el número de comprobante.');
    }

    setGuardando(true);

    const resp = await onGenerarComprobante({
      id_orden: ordenSel.id_orden,
      tipo_comprobante: tipoComprobante,
      condicion_pago: condicionPago,
      metodo_pago: metodoPago,
      id_cuenta_bancaria: idCuentaSel || undefined,
      numero_comprobante: numComprobanteBanco || undefined,
    });

    setGuardando(false);

    if (resp.success) {
      setDocumentoEmitido({
        numero: resp.correlativo,
        cliente: ordenSel.cotizaciones?.cliente_nombre || 'Cliente',
        tipo: tipoComprobante,
        total: montoTotal,
        subtotal: subtotalNeto,
        iva: iva13,
        items: ordenSel.cotizaciones?.cotizacion_detalles || [],
        condicion: condicionPago,
        metodo: metodoPago
      });
      setOrdenSel(null);
    } else {
      alert(`Error al facturar: ${resp.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-2 md:p-5">
      
      {/* ==================================================================== */}
      {/* FORMULARIO DE FACTURACIÓN (Izquierda) */}
      {/* ==================================================================== */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="flex items-center gap-2 mt-0 text-lg font-bold text-slate-800 border-b pb-3">
          <FileText size={20} className="text-sky-600" />
          Emisión de Comprobante
        </h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Orden Despachada a Facturar:</label>
            <select 
              onChange={(e) => {
                const encontrada = ordenesPorFacturar.find((o) => o.id_orden === e.target.value);
                setOrdenSel(encontrada || null);
              }} 
              value={ordenSel?.id_orden || ''} 
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Seleccionar Orden --</option>
              {ordenesPorFacturar.map((ord) => (
                <option key={ord.id_orden} value={ord.id_orden}>
                  {ord.numero_orden} — {ord.cotizaciones?.cliente_nombre || 'Cliente'} (${Number(ord.cotizaciones?.total ?? ord.total_despachado ?? 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Tipo de Documento Fiscal:</label>
            <select value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm">
              <option value="FACTURA_CONSUMIDOR_FINAL">Factura Consumidor Final</option>
              <option value="CREDITO_FISCAL">Comprobante de Crédito Fiscal (CCF)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Condición de Pago:</label>
            <select value={condicionPago} onChange={(e) => setCondicionPago(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm">
              <option value="CONTADO">Contado</option>
              <option value="CREDITO_15_DIAS">Crédito 15 días</option>
              <option value="CREDITO_30_DIAS">Crédito 30 días</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Método de Pago:</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm">
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="EFECTIVO">Efectivo / Caja Chica</option>
              <option value="TARJETA">Tarjeta / Pasarela</option>
            </select>
          </div>

          {metodoPago === 'TRANSFERENCIA' && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="text-xs font-bold text-slate-600 block mb-1">Cuenta Bancaria Receptora:</label>
              <select value={idCuentaSel} onChange={(e) => setIdCuentaSel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm mb-3">
                <option value="">-- Seleccionar Banco --</option>
                {cuentasBancarias.map((cta) => (
                  <option key={cta.id_cuenta} value={cta.id_cuenta}>{cta.banco}: {cta.numero_cuenta}</option>
                ))}
              </select>
              <label className="text-xs font-bold text-slate-600 block mb-1">N° de Comprobante / Referencia:</label>
              <input type="text" placeholder="Ej: TRANS-987654" value={numComprobanteBanco} onChange={(e) => setNumComprobanteBanco(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
            </div>
          )}

          {ordenSel && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-sm">
              <div className="flex justify-between text-slate-600 mb-1"><span>Monto Neto:</span><span>${subtotalNeto.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600 mb-1"><span>IVA (13%):</span><span>${iva13.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg text-green-700 border-t border-green-200 pt-2 mt-2"><span>Total:</span><span>${montoTotal.toFixed(2)}</span></div>
            </div>
          )}

          <button type="submit" disabled={guardando || !ordenSel} className={`w-full py-3 mt-2 rounded-md font-bold text-white flex items-center justify-center gap-2 transition-colors ${guardando || !ordenSel ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
            <CreditCard size={18} />
            {guardando ? 'Generando...' : 'Registrar Pago y Facturar'}
          </button>
        </form>
      </div>

      {/* ==================================================================== */}
      {/* VISTA PREVIA (Derecha) */}
      {/* ==================================================================== */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="flex items-center gap-2 mt-0 text-lg font-bold text-slate-800 border-b pb-3">
          <Eye size={20} className="text-sky-600" />
          Vista Previa del Documento
        </h3>

        {documentoEmitido ? (
          <>
            {/* Contenedor de la factura con scroll horizontal para móviles */}
            <div className="w-full overflow-x-auto mt-4 pb-4">
              <div 
                ref={componenteFacturaRef} 
                className="bg-white p-6 md:p-10 text-slate-800 font-sans min-w-[600px] border border-slate-100 shadow-sm"
              >
                {/* CABECERA */}
                <div className="flex justify-between items-center border-b-4 border-sky-600 pb-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-14 relative">
                      <Image src="/img/logo-agrolactec.png" alt="Logo" fill className="object-contain object-left" />
                    </div>
                    <div>
                      <h1 className="m-0 text-xl text-sky-700 font-bold">AGROLACTEC S.A. DE C.V.</h1>
                      <p className="m-0 text-xs text-slate-500">San Salvador, El Salvador</p>
                      <p className="m-0 text-xs text-slate-500">NIT: 0614-123456-101-1</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="m-0 text-lg text-sky-700 font-bold">{documentoEmitido.tipo.replace(/_/g, ' ')}</h2>
                    <p className="m-0 font-bold text-sm">N°: {documentoEmitido.numero}</p>
                    <p className="m-0 text-xs">Fecha: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* DATOS DEL CLIENTE */}
                <div className="flex justify-between mb-6 text-sm">
                  <div>
                    <p className="m-0 font-bold text-sky-600 uppercase text-xs">Cliente:</p>
                    <p className="m-0 font-bold">{documentoEmitido.cliente}</p>
                  </div>
                  <div>
                    <p className="m-0 font-bold text-sky-600 uppercase text-xs">Condición:</p>
                    <p className="m-0">{documentoEmitido.condicion.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="m-0 font-bold text-sky-600 uppercase text-xs">Método:</p>
                    <p className="m-0">{documentoEmitido.metodo}</p>
                  </div>
                </div>

                {/* TABLA DE PRODUCTOS */}
                <table className="w-full text-sm border-collapse mb-6">
                  <thead>
                    <tr className="bg-sky-600 text-white text-left">
                      <th className="p-2 border border-sky-600">Descripción</th>
                      <th className="p-2 border border-sky-600 text-center">Cant.</th>
                      <th className="p-2 border border-sky-600 text-right">Precio Unit.</th>
                      <th className="p-2 border border-sky-600 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentoEmitido.items && documentoEmitido.items.length > 0 ? (
                      documentoEmitido.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="p-2 border-b border-slate-200">{item.nombre_producto}</td>
                          <td className="p-2 border-b border-slate-200 text-center">{item.cantidad} {item.unidad_medida}</td>
                          <td className="p-2 border-b border-slate-200 text-right">${Number(item.precio_unitario).toFixed(2)}</td>
                          <td className="p-2 border-b border-slate-200 text-right">${Number(item.subtotal_item).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">No hay detalles disponibles.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* TOTALES */}
                <div className="flex justify-end mb-8">
                  <div className="w-64 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-sm mb-1"><span>Subtotal:</span><span>${documentoEmitido.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm mb-1"><span>IVA (13%):</span><span>${documentoEmitido.iva.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base border-t border-slate-300 pt-2 mt-2"><span>TOTAL:</span><span>${documentoEmitido.total.toFixed(2)}</span></div>
                  </div>
                </div>

                {/* FIRMAS */}
                <div className="flex justify-between mt-12 pt-6">
                  <div className="w-2/5 border-t border-slate-800 text-center pt-2 text-xs">Firma Autorizada</div>
                  <div className="w-2/5 border-t border-slate-800 text-center pt-2 text-xs">Recibido por Cliente</div>
                </div>

                <div className="text-center mt-8 text-[10px] text-slate-400">
                  ¡Gracias por su compra! Este documento es un comprobante válido de su transacción.
                </div>
              </div>
            </div>

            <button onClick={() => handlePrint()} className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold flex justify-center items-center gap-2 transition-colors">
              <Printer size={18} /> Imprimir Factura
            </button>
          </>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <SearchX size={48} className="text-slate-300 mb-4" />
            <p className="max-w-xs text-sm">Selecciona una orden a la izquierda para proceder con el cobro y emisión del documento.</p>
          </div>
        )}
      </div>
    </div>
  );
}