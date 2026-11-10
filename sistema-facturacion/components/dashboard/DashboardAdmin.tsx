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

  if (!datos) return <p style={{ padding: '20px' }}>Cargando datos del servidor...</p>;

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
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ backgroundColor: color + '20', padding: '15px', borderRadius: '50%', color: color }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>{title}</p>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>{value}</h2>
        {subtitle && <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 🔥 BANNER DE ALERTA (Solo si la temperatura es alta) */}
      {esAlertaTemperatura && (
        <div style={{ 
          backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', 
          padding: '15px 20px', borderRadius: '8px', display: 'flex', 
          alignItems: 'center', gap: '10px', fontWeight: 'bold'
        }}>
          <AlertTriangle size={24} />
          <div>
            <p style={{ margin: 0, fontSize: '1rem' }}>⚠️ ALERTA CRÍTICA DE CADENA DE FRÍO</p>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'normal' }}>
              El sensor del camión ha detectado {temperatura} °C. Se recomienda revisar el sistema de refrigeración.
            </p>
          </div>
        </div>
      )}

      {/* TARJETAS DE KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <Card title="Ventas de Hoy" value={`$${datos.ventasHoy?.toFixed(2) || '0.00'}`} icon={<DollarSign size={24} />} color="#16a34a" />
        <Card title="Ventas Totales" value={`$${datos.ventasTotales?.toFixed(2) || '0.00'}`} icon={<TrendingUp size={24} />} color="#0284c7" />
        <Card title="Pedidos Pendientes" value={datos.pedidosPendientes || 0} icon={<ShoppingCart size={24} />} color="#f59e0b" subtitle="Por despachar" />
        
        {/* TARJETA DE TEMPERATURA */}
        <div style={{ 
          backgroundColor: esAlertaTemperatura ? '#fef2f2' : '#fff', padding: '20px', borderRadius: '10px', 
          border: `2px solid ${esAlertaTemperatura ? '#ef4444' : '#e2e8f0'}`, display: 'flex', 
          alignItems: 'center', gap: '15px', transition: 'all 0.3s'
        }}>
          <div style={{ backgroundColor: esAlertaTemperatura ? '#fee2e2' : '#dcfce7', padding: '15px', borderRadius: '50%', color: esAlertaTemperatura ? '#ef4444' : '#16a34a' }}>
            <Thermometer size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Sensor Camión Refrigerado</p>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: esAlertaTemperatura ? '#ef4444' : '#0f172a' }}>{temperatura} °C</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: esAlertaTemperatura ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>
              {esAlertaTemperatura ? '⚠️ Cadena de frío rota' : '✅ Temperatura óptima'}
            </p>
          </div>
        </div>
      </div>

      {/* GRÁFICOS (Fila de 2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        
        {/* Gráfico de Ventas Semanales */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="#0284c7" /> Resumen de Ventas (Semana)
          </h3>
          <div style={{ height: '300px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataGrafico}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ventas" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔥 Gráfico de Top Productos Vendidos */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="#f59e0b" /> Top Productos Vendidos
          </h3>
          <div style={{ height: '300px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataProductos} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="ventas" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ALERTAS DE VENCIMIENTO Y MONITOREO DE FLOTA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Alertas de Vencimiento */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="#ef4444" /> Lotes por Vencer
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
            {datos.lotesVencer?.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No hay lotes por vencer. 🎉</p>
            ) : (
              datos.lotesVencer?.map((lote: any, i: number) => (
                <div key={i} style={{ padding: '10px', backgroundColor: '#fef2f2', borderRadius: '6px', borderLeft: '4px solid #ef4444', minWidth: '200px', flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a' }}>{lote.productos?.nombre}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Lote: {lote.codigo_lote}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#b91c1c' }}>Vence: {lote.fecha_vencimiento}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monitoreo de Flota */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={20} color="#0284c7" /> Monitoreo de Flota (Última milla)
          </h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '15px' }}>
            <div style={{ flex: 1, minWidth: '200px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Placa del Vehículo</span>
              <h4 style={{ margin: '5px 0 0 0', color: '#0f172a' }}>CAM-001 (AgroLactec)</h4>
            </div>
            <div style={{ flex: 1, minWidth: '200px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Ruta Actual</span>
              <h4 style={{ margin: '5px 0 0 0', color: '#0f172a' }}>San Salvador → Apopa</h4>
            </div>
            <div style={{ flex: 1, minWidth: '200px', padding: '15px', backgroundColor: esAlertaTemperatura ? '#fee2e2' : '#dcfce7', borderRadius: '8px', border: `1px solid ${esAlertaTemperatura ? '#fecaca' : '#bbf7d0'}` }}>
              <span style={{ fontSize: '0.75rem', color: esAlertaTemperatura ? '#b91c1c' : '#15803d', fontWeight: 'bold' }}>Estado de Refrigeración</span>
              <h4 style={{ margin: '5px 0 0 0', color: esAlertaTemperatura ? '#b91c1c' : '#15803d' }}>
                {esAlertaTemperatura ? 'FALLA DETECTADA' : 'OPERATIVO'}
              </h4>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}