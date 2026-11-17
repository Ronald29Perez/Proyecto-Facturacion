// components/dashboard/DashboardAdmin.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingCart, AlertTriangle, Clock, TrendingUp, Thermometer, Truck, Package
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardAdmin({ datos }: { datos: any }) {
  // Estado para simular la temperatura del sensor IoT
  const [temperatura, setTemperatura] = useState(4.2);

  useEffect(() => {
    const interval = setInterval(() => {
      const nuevaTemp = parseFloat((Math.random() * 6 + 2).toFixed(1));
      setTemperatura(nuevaTemp);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!datos) return <p className="p-5 text-slate-500">Cargando datos del servidor...</p>;

  const esAlertaTemperatura = temperatura > 6;

  // Datos simulados para el gráfico semanal
  const dataGrafico = [
    { name: 'Lun', ventas: 4000 },
    { name: 'Mar', ventas: 3000 },
    { name: 'Mié', ventas: 2000 },
    { name: 'Jue', ventas: 2780 },
    { name: 'Vie', ventas: 1890 },
    { name: 'Sáb', ventas: 2390 },
  ];

  // Datos reales de los productos más vendidos
  const dataProductos = datos.productosMasVendidos || [];

  const Card = ({ title, value, icon, color, subtitle }: any) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm w-full">
      <div className="p-4 rounded-full flex-shrink-0" style={{ backgroundColor: color + '20', color: color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="m-0 text-sm text-slate-500 font-bold truncate">{title}</p>
        <h2 className="m-0 text-2xl text-slate-900 truncate">{value}</h2>
        {subtitle && <p className="m-0 text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* 🔥 BANNER DE ALERTA (Solo si la temperatura es alta) */}
      {esAlertaTemperatura && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3 shadow-sm animate-pulse">
          <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="m-0 font-bold text-base">⚠️ ALERTA CRÍTICA DE CADENA DE FRÍO</p>
            <p className="m-0 text-sm font-normal mt-1">
              El sensor del camión ha detectado {temperatura} °C. Se recomienda revisar el sistema de refrigeración.
            </p>
          </div>
        </div>
      )}

      {/* TARJETAS DE KPIs (1 columna en cel, 2 en tablet, 4 en PC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Ventas de Hoy" value={`$${datos.ventasHoy?.toFixed(2) || '0.00'}`} icon={<DollarSign size={24} />} color="#16a34a" />
        <Card title="Ventas Totales" value={`$${datos.ventasTotales?.toFixed(2) || '0.00'}`} icon={<TrendingUp size={24} />} color="#0284c7" />
        <Card title="Pedidos Pendientes" value={datos.pedidosPendientes || 0} icon={<ShoppingCart size={24} />} color="#f59e0b" subtitle="Por despachar" />
        
        {/* TARJETA DE TEMPERATURA */}
        <div className={`p-5 rounded-xl border flex items-center gap-4 shadow-sm transition-all w-full ${esAlertaTemperatura ? 'bg-red-50 border-red-500' : 'bg-white border-slate-200'}`}>
          <div className={`p-4 rounded-full flex-shrink-0 ${esAlertaTemperatura ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'}`}>
            <Thermometer size={24} />
          </div>
          <div className="min-w-0">
            <p className="m-0 text-sm text-slate-500 font-bold truncate">Sensor Camión</p>
            <h2 className={`m-0 text-2xl truncate ${esAlertaTemperatura ? 'text-red-500' : 'text-slate-900'}`}>{temperatura} °C</h2>
            <p className={`m-0 text-xs font-bold truncate ${esAlertaTemperatura ? 'text-red-500' : 'text-green-600'}`}>
              {esAlertaTemperatura ? '⚠️ Cadena de frío rota' : '✅ Temperatura óptima'}
            </p>
          </div>
        </div>
      </div>

      {/* GRÁFICOS (Se apilan en cel, 2 columnas en PC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Gráfico de Ventas Semanales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm w-full">
          <h3 className="m-0 text-slate-900 flex items-center gap-2 text-lg font-bold">
            <TrendingUp size={20} className="text-sky-600" /> Resumen de Ventas
          </h3>
          <div className="h-72 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataGrafico}>
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} width={40} />
                <Tooltip />
                <Bar dataKey="ventas" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Top Productos Vendidos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm w-full">
          <h3 className="m-0 text-slate-900 flex items-center gap-2 text-lg font-bold">
            <Package size={20} className="text-amber-500" /> Top Productos
          </h3>
          <div className="h-72 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataProductos} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{fontSize: 12}} />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="ventas" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ALERTAS DE VENCIMIENTO Y MONITOREO DE FLOTA */}
      <div className="grid grid-cols-1 gap-4">
        
        {/* Alertas de Vencimiento */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="m-0 text-slate-900 flex items-center gap-2 text-lg font-bold mb-4">
            <Clock size={20} className="text-red-500" /> Lotes por Vencer
          </h3>
          <div className="flex gap-3 flex-wrap">
            {datos.lotesVencer?.length === 0 ? (
              <p className="text-slate-400 text-sm m-0">No hay lotes por vencer. 🎉</p>
            ) : (
              datos.lotesVencer?.map((lote: any, i: number) => (
                <div key={i} className="p-3 bg-red-50 rounded-md border-l-4 border-red-500 min-w-[200px] flex-1">
                  <strong className="block text-sm text-slate-900 truncate">{lote.productos?.nombre}</strong>
                  <span className="text-xs text-slate-500 block">Lote: {lote.codigo_lote}</span>
                  <span className="block text-xs text-red-700 font-bold mt-1">Vence: {lote.fecha_vencimiento}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monitoreo de Flota */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="m-0 text-slate-900 flex items-center gap-2 text-lg font-bold mb-4">
            <Truck size={20} className="text-sky-600" /> Monitoreo de Flota
          </h3>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[150px] p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 font-bold uppercase">Vehículo</span>
              <h4 className="m-0 text-slate-900 mt-1 truncate">CAM-001</h4>
            </div>
            <div className="flex-1 min-w-[150px] p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 font-bold uppercase">Ruta Actual</span>
              <h4 className="m-0 text-slate-900 mt-1 truncate">SS → Apopa</h4>
            </div>
            <div className={`flex-1 min-w-[150px] p-4 rounded-lg border ${esAlertaTemperatura ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <span className={`text-xs font-bold uppercase ${esAlertaTemperatura ? 'text-red-700' : 'text-green-700'}`}>Refrigeración</span>
              <h4 className={`m-0 mt-1 truncate ${esAlertaTemperatura ? 'text-red-700' : 'text-green-700'}`}>
                {esAlertaTemperatura ? 'FALLA' : 'OPERATIVO'}
              </h4>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}