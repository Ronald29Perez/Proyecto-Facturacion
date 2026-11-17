'use client';
import React, { useState, useMemo } from 'react';
import { MapPin, Calendar, Truck } from 'lucide-react';

const SUCURSAL_AGROLACTEC = "San Salvador, El Salvador";
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function MonitoreoRuta({ cotizaciones }: { cotizaciones: any[] }) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(new Date().getDay());
  const [pedidoEnMapa, setPedidoEnMapa] = useState<any | null>(null);

  const pedidosValidos = cotizaciones.filter(c => {
    if (!c.datos_entrega) return false;
    try {
      const d = JSON.parse(c.datos_entrega);
      return d.direccion && d.direccion.length > 5;
    } catch { return false; }
  });

  const pedidosPorDia = useMemo(() => {
    const grupos: Record<number, any[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    pedidosValidos.forEach(p => {
      const fecha = new Date(p.fecha_emision);
      const dia = fecha.getDay();
      grupos[dia].push(p);
    });
    return grupos;
  }, [pedidosValidos]);

  const pedidosDelDia = pedidosPorDia[diaSeleccionado] || [];
  const pedidoAMostrar = pedidoEnMapa || pedidosDelDia[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      
      {/* COLUMNA IZQUIERDA: PLANIFICADOR (Ocupa 1/3 en PC) */}
      <div className="col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
        
        <h3 className="flex items-center gap-2 mt-0 text-lg font-bold text-slate-800">
          <Calendar size={20} className="text-sky-600" />
          Planificador Semanal
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Selecciona un día para ver las rutas asignadas.
        </p>

        {/* Tabla de Días */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg mb-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-2 font-bold">Día</th>
                <th className="p-2 text-center font-bold">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {DIAS_SEMANA.map((dia, index) => {
                const cantidad = pedidosPorDia[index]?.length || 0;
                const isSelected = diaSeleccionado === index;
                return (
                  <tr 
                    key={index} 
                    onClick={() => { setDiaSeleccionado(index); setPedidoEnMapa(null); }}
                    className={`border-b border-slate-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className={`p-2 ${isSelected ? 'font-bold text-sky-600' : 'text-slate-700'}`}>
                      {dia}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        cantidad > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {cantidad}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Lista de Pedidos del Día */}
        <h4 className="m-0 mb-3 text-sm font-bold text-slate-800">
          Pedidos del {DIAS_SEMANA[diaSeleccionado]}:
        </h4>
        
        {pedidosDelDia.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No hay pedidos para este día.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
            {pedidosDelDia.map((cot) => {
              const data = JSON.parse(cot.datos_entrega);
              const isSelected = pedidoAMostrar?.id_cotizacion === cot.id_cotizacion;
              return (
                <div
                  key={cot.id_cotizacion}
                  onClick={() => setPedidoEnMapa(cot)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-sky-300'
                  }`}
                >
                  <strong className="block text-xs font-bold text-sky-600 mb-0.5">
                    {cot.numero_cotizacion}
                  </strong>
                  <span className="text-sm text-slate-800 font-medium block">{cot.cliente_nombre}</span>
                  <span className="text-xs text-slate-500 mt-1 block truncate">
                    <MapPin size={12} className="inline mr-1" />
                    {data.direccion}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: MAPA (Ocupa 2/3 en PC) */}
      <div className="col-span-1 lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
        
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
          <Truck size={20} className="text-sky-600" />
          <h3 className="m-0 text-lg font-bold text-slate-800">Ruta - {DIAS_SEMANA[diaSeleccionado]}</h3>
        </div>

        {pedidoAMostrar ? (
          <div className="flex-1 flex flex-col">
            {/* Datos del Cliente */}
            <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm flex flex-col sm:flex-row justify-between gap-2 border border-slate-200">
              <div>
                <p className="m-0"><strong>Cliente:</strong> {pedidoAMostrar.cliente_nombre}</p>
                <p className="m-0 text-slate-600 truncate"><strong>Dirección:</strong> {JSON.parse(pedidoAMostrar.datos_entrega).direccion}</p>
              </div>
              <div className="sm:text-right">
                <p className="m-0"><strong>Teléfono:</strong> {JSON.parse(pedidoAMostrar.datos_entrega).telefono}</p>
              </div>
            </div>
            
            {/* IFRAME DE GOOGLE MAPS */}
            <div className="flex-1 w-full rounded-lg overflow-hidden border border-slate-200 relative min-h-[350px]">
              <iframe
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0, border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?saddr=${encodeURIComponent(SUCURSAL_AGROLACTEC)}&daddr=${encodeURIComponent(JSON.parse(pedidoAMostrar.datos_entrega).direccion)}&output=embed`}
              ></iframe>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <MapPin size={48} className="text-slate-300 mb-4" />
            <p className="max-w-xs text-sm">Selecciona un pedido de la lista para visualizar la ruta en el mapa.</p>
          </div>
        )}
      </div>
    </div>
  );
}