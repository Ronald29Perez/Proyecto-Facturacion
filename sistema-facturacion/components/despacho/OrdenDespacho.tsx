// ============================================================================
// COMPONENTE: GESTIÓN DE ÓRDENES DE DESPACHO Y MOTOR FIFO (RESPONSIVE)
// Ubicación: components/despacho/OrdenDespacho.tsx
// ============================================================================

'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import { 
  Inbox, Package, Zap, Printer, CheckCircle2, MousePointerClick, Box, CreditCard, Clock
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
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<CotizacionEntity | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultadoDespacho, setResultadoDespacho] = useState<{
    success: boolean;
    message: string;
    id_orden?: string;
  } | null>(null);
  const [pickingList, setPickingList] = useState<PickingItem[]>([]);

  const pickingListRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: pickingListRef,
    documentTitle: `PickingList_AgroLactec_${resultadoDespacho?.id_orden?.slice(0, 8) || 'Nuevo'}`,
  });

  const handleProcesar = async (idCotizacion: string) => {
    if (!confirm('¿Deseas procesar el despacho de esta cotización? Se descontará stock de los lotes más antiguos (FIFO).')) {
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
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 p-2 md:p-5">
      
      {/* ==================================================================== */}
      {/* BANDEJA DE COTIZACIONES PENDIENTES (Ocupa 2/5 en PC) */}
      {/* ==================================================================== */}
      <div className="col-span-1 lg:col-span-2 border border-slate-300 p-4 md:p-5 rounded-lg bg-white shadow-sm flex flex-col">
        <h3 className="flex items-center gap-2 mt-0 text-lg font-bold text-slate-800 border-b pb-3 mb-2">
          <Inbox size={20} className="text-sky-600" />
          Cotizaciones ({cotizacionesPendientes.length})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Selecciona una cotización para ejecutar el despacho FIFO.
        </p>

        {cotizacionesPendientes.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-md flex flex-col items-center gap-2 border border-dashed border-slate-300 my-auto">
            <Inbox size={32} className="text-slate-300" />
            <span className="text-sm">No hay cotizaciones pendientes.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1">
            {cotizacionesPendientes.map((cot) => (
              <div
                key={cot.id_cotizacion}
                onClick={() => setCotizacionSeleccionada(cot)}
                className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                  cotizacionSeleccionada?.id_cotizacion === cot.id_cotizacion
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between font-bold text-sm text-slate-800">
                  <span>{cot.numero_cotizacion}</span>
                  <span className="text-blue-600">${Number(cot.total).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-slate-600 truncate mr-2">
                    Cliente: <strong>{cot.cliente_nombre}</strong>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1 shrink-0 ${
                    cot.estado === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {cot.estado === 'PAGADO' ? <><CreditCard size={10}/> Pagado</> : <><Clock size={10}/> Pendiente</>}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 mt-1">
                  Fecha: {new Date(cot.fecha_emision).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* DETALLE Y EJECUCIÓN (Ocupa 3/5 en PC) */}
      {/* ==================================================================== */}
      <div className="col-span-1 lg:col-span-3 border border-slate-300 p-4 md:p-5 rounded-lg bg-white shadow-sm">
        {cotizacionSeleccionada ? (
          <div>
            <h3 className="flex items-center gap-2 mt-0 text-lg font-bold text-slate-800">
              <Package size={22} className="text-sky-600" />
              Despacho: {cotizacionSeleccionada.numero_cotizacion}
            </h3>

            <div className="p-3 bg-slate-50 rounded-md my-4 text-sm border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>Cliente: <strong className="text-slate-800">{cotizacionSeleccionada.cliente_nombre}</strong></div>
                <div>Tipo: <strong className="text-slate-800">{cotizacionSeleccionada.cliente_tipo}</strong></div>
                <div className="sm:col-span-2">Estado de Pago: <strong className={cotizacionSeleccionada.estado === 'PAGADO' ? 'text-green-600' : 'text-amber-600'}>{cotizacionSeleccionada.estado}</strong></div>
              </div>
            </div>

            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Box size={18} /> Ítems del Pedido:
            </h4>
            
            {/* Tabla con scroll horizontal en celular */}
            <div className="w-full overflow-x-auto mb-4 border border-slate-200 rounded-md">
              <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th className="p-2">Producto</th>
                    <th className="p-2 text-center">Cantidad</th>
                    <th className="p-2">Empaque</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(cotizacionSeleccionada.detalles || cotizacionSeleccionada.cotizacion_detalles || []).map((det) => (
                    <tr key={det.id_detalle} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2">{det.nombre_producto}</td>
                      <td className="p-2 text-center font-bold">{det.cantidad}</td>
                      <td className="p-2">{det.unidad_medida}</td>
                      <td className="p-2 text-right">${Number(det.subtotal_item).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right mt-4 text-sm space-y-1 bg-slate-50 p-3 rounded-md">
              <div>Subtotal: ${Number(cotizacionSeleccionada.subtotal).toFixed(2)}</div>
              <div>IVA (13%): ${Number(cotizacionSeleccionada.impuesto_iva).toFixed(2)}</div>
              <div className="text-lg font-bold text-green-600">Total: ${Number(cotizacionSeleccionada.total).toFixed(2)}</div>
            </div>

            <button
              onClick={() => handleProcesar(cotizacionSeleccionada.id_cotizacion)}
              disabled={procesando}
              className={`w-full py-3 mt-5 rounded-md font-bold text-white flex items-center justify-center gap-2 transition-colors ${
                procesando ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Zap size={18} />
              {procesando ? 'Procesando FIFO...' : 'Ejecutar Despacho FIFO'}
            </button>
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <MousePointerClick size={48} className="text-slate-300 mb-4" />
            <p className="max-w-xs text-sm">Selecciona una cotización de la lista para ver los detalles y ejecutar la salida de bodega.</p>
          </div>
        )}

        {/* RESULTADO DEL DESPACHO */}
        {resultadoDespacho && !pickingList.length && (
          <div className={`mt-5 p-4 rounded-md border ${
            resultadoDespacho.success ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
          }`}>
            <h4 className="m-0 flex items-center gap-2 font-bold">
              <CheckCircle2 size={18} /> {resultadoDespacho.message}
            </h4>
          </div>
        )}

        {/* ================================================================== */}
        {/* PICKING LIST (CON REFERENCIA PARA IMPRIMIR) */}
        {/* ================================================================== */}
        {pickingList.length > 0 && (
          <>
            <div 
              ref={pickingListRef}
              className="bg-white p-4 md:p-8 text-slate-800 font-sans mt-5 rounded border border-slate-200"
              style={{ minWidth: '600px' }} // Forzamos un ancho mínimo para que la impresión se vea bien
            >
              {/* CABECERA */}
              <div className="flex justify-between items-center border-b-4 border-amber-500 pb-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-32 h-12 relative">
                    <Image src="/img/logo-agrolactec.png" alt="Logo" fill className="object-contain object-left" />
                  </div>
                  <div>
                    <h1 className="m-0 text-xl text-amber-800 font-bold">ORDEN DE DESPACHO</h1>
                    <p className="m-0 text-xs text-slate-500">AgroLactec S.A. de C.V.</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="m-0 text-lg text-amber-800 font-bold">PICKING LIST</h2>
                  <p className="m-0 font-bold text-sm">N° Orden: {resultadoDespacho?.id_orden?.slice(0,8)}...</p>
                  <p className="m-0 text-xs">Fecha: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* DATOS DE ENTREGA */}
              <div className="flex flex-wrap gap-8 mb-6 bg-amber-50 p-3 rounded border border-amber-200">
                <div>
                  <p className="m-0 font-bold text-amber-800 text-xs uppercase">Cliente:</p>
                  <p className="m-0 font-bold">{cotizacionSeleccionada?.cliente_nombre || 'Cliente'}</p>
                </div>
                <div>
                  <p className="m-0 font-bold text-amber-800 text-xs uppercase">Pedido Ref:</p>
                  <p className="m-0">{cotizacionSeleccionada?.numero_cotizacion || '—'}</p>
                </div>
                <div>
                  <p className="m-0 font-bold text-amber-800 text-xs uppercase">Tipo:</p>
                  <p className="m-0">{cotizacionSeleccionada?.cliente_tipo || '—'}</p>
                </div>
              </div>

              {/* TABLA DE PICKING LIST */}
              <table className="w-full text-sm border-collapse mb-6">
                <thead>
                  <tr className="bg-amber-500 text-white text-left">
                    <th className="p-2 border border-amber-500">Producto</th>
                    <th className="p-2 border border-amber-500">Código Lote</th>
                    <th className="p-2 border border-amber-500">Vencimiento</th>
                    <th className="p-2 border border-amber-500 text-center">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {pickingList.map((item) => (
                    <tr key={item.id_despacho_detalle}>
                      <td className="p-2 border-b border-slate-200">
                        <div className="font-bold">{item.lotes?.productos?.nombre}</div>
                        <div className="text-xs text-slate-500">{item.lotes?.productos?.item_code}</div>
                      </td>
                      <td className="p-2 border-b border-slate-200 font-mono font-bold">{item.lotes?.codigo_lote}</td>
                      <td className="p-2 border-b border-slate-200">
                        {item.lotes?.fecha_vencimiento ? new Date(item.lotes.fecha_vencimiento).toLocaleDateString('es-SV') : '—'}
                      </td>
                      <td className="p-2 border-b border-slate-200 text-center font-bold text-green-600 text-lg">{item.cantidad_descontada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* RESUMEN Y FIRMAS */}
              <div className="flex justify-between items-end mt-10">
                <div className="text-sm text-slate-500">
                  <p className="m-0"><strong>Total de lotes:</strong> {pickingList.length}</p>
                  <p className="m-0"><strong>Total de unidades:</strong> {pickingList.reduce((sum, item) => sum + item.cantidad_descontada, 0)}</p>
                </div>
                <div className="flex gap-10">
                  <div className="text-center">
                    <div className="border-t border-slate-800 w-48 pt-1 text-xs">Entregado por Bodega</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-slate-800 w-48 pt-1 text-xs">Recibido por Cliente</div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN DE IMPRESIÓN */}
            <button 
              onClick={() => handlePrint()} 
              className="w-full py-3 mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-md flex justify-center items-center gap-2 transition-colors"
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