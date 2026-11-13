'use client';
import React, { useState, useMemo } from 'react';
import { MapPin, Calendar, Truck } from 'lucide-react';

const SUCURSAL_AGROLACTEC = "San Salvador, El Salvador";
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function MonitoreoRuta({ cotizaciones }: { cotizaciones: any[] }) {
  // Estado para saber qué día estamos viendo (0 = Domingo, 1 = Lunes...)
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(new Date().getDay());
  
  // Estado para el pedido que se verá en el mapa (por defecto el primero del día)
  const [pedidoEnMapa, setPedidoEnMapa] = useState<any | null>(null);

  // 1. Filtrar pedidos válidos
  const pedidosValidos = cotizaciones.filter(c => {
    if (!c.datos_entrega) return false;
    try {
      const d = JSON.parse(c.datos_entrega);
      return d.direccion && d.direccion.length > 5;
    } catch { return false; }
  });

  // 2. Agrupar pedidos por día de la semana (basado en la fecha de emisión)
  const pedidosPorDia = useMemo(() => {
    const grupos: Record<number, any[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    pedidosValidos.forEach(p => {
      const fecha = new Date(p.fecha_emision);
      const dia = fecha.getDay();
      grupos[dia].push(p);
    });
    return grupos;
  }, [pedidosValidos]);

  // Pedidos del día actual seleccionado
  const pedidosDelDia = pedidosPorDia[diaSeleccionado] || [];
  
  // Si no hay un pedido seleccionado para el mapa, tomamos el primero del día
  const pedidoAMostrar = pedidoEnMapa || pedidosDelDia[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
      
      {/* ==================================================================== */}
      {/* COLUMNA IZQUIERDA: TABLA DE DÍAS Y PEDIDOS */}
      {/* ==================================================================== */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', height: 'fit-content' }}>
        
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
          <Calendar size={20} color="#0284c7" />
          Planificador Semanal
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
          Selecciona un día para ver las rutas asignadas.
        </p>

        {/* Tabla de Días */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '8px' }}>Día</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Pedidos</th>
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
                  style={{ 
                    borderBottom: '1px solid #e2e8f0', 
                    backgroundColor: isSelected ? '#eff6ff' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '8px', fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#0284c7' : '#333' }}>
                    {dia}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: cantidad > 0 ? '#dbeafe' : '#f1f5f9', 
                      color: cantidad > 0 ? '#1e40af' : '#94a3b8',
                      padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.75rem'
                    }}>
                      {cantidad}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Lista de Pedidos del Día */}
        <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '0.9rem' }}>
          Pedidos del {DIAS_SEMANA[diaSeleccionado]}:
        </h4>
        
        {pedidosDelDia.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No hay pedidos para este día.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {pedidosDelDia.map((cot) => {
              const data = JSON.parse(cot.datos_entrega);
              const isSelected = pedidoAMostrar?.id_cotizacion === cot.id_cotizacion;
              return (
                <div
                  key={cot.id_cotizacion}
                  onClick={() => setPedidoEnMapa(cot)}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#eff6ff' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: '#0284c7' }}>
                    {cot.numero_cotizacion}
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: '#0f172a' }}>{cot.cliente_nombre}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: '2px' }} />
                    {data.direccion}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* COLUMNA DERECHA: MAPA */}
      {/* ==================================================================== */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <Truck size={20} color="#0284c7" />
          <h3 style={{ margin: 0 }}>Mapa de Ruta - {DIAS_SEMANA[diaSeleccionado]}</h3>
        </div>

        {pedidoAMostrar ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '10px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>Cliente:</strong> {pedidoAMostrar.cliente_nombre} <br/>
                <strong>Dirección:</strong> {JSON.parse(pedidoAMostrar.datos_entrega).direccion}
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Teléfono:</strong> {JSON.parse(pedidoAMostrar.datos_entrega).telefono}
              </div>
            </div>
            
            {/* IFRAME DE GOOGLE MAPS */}
            <iframe
              width="100%"
              style={{ flex: 1, border: 0, borderRadius: '8px', minHeight: '400px' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?saddr=${encodeURIComponent(SUCURSAL_AGROLACTEC)}&daddr=${encodeURIComponent(JSON.parse(pedidoAMostrar.datos_entrega).direccion)}&output=embed`}
            ></iframe>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <MapPin size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
            <p>Selecciona un pedido para ver la ruta en el mapa.</p>
          </div>
        )}
      </div>
    </div>
  );
}