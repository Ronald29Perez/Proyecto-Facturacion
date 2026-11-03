'use client';
import React, { useState } from 'react';

// Pega aquí la dirección de tu sucursal (AgroLactec)
const SUCURSAL_AGROLACTEC = "San Salvador, El Salvador";

export default function MonitoreoRuta({ cotizaciones }: { cotizaciones: any[] }) {
  const [rutaSeleccionada, setRutaSeleccionada] = useState<any | null>(null);

  // Extraemos los pedidos que tengan dirección en su JSON de entrega
  const pedidosConRuta = cotizaciones.filter(c => {
    if (!c.datos_entrega) return false;
    try {
      const d = JSON.parse(c.datos_entrega);
      return d.direccion && d.direccion.length > 5;
    } catch { return false; }
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
      {/* Lista de Pedidos */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', height: 'fit-content' }}>
        <h3 style={{ marginTop: 0 }}>🗺️ Rutas de Entrega</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Selecciona un pedido para ver la ruta en el mapa.</p>
        
        {pedidosConRuta.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No hay pedidos con dirección válida.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            {pedidosConRuta.map(cot => {
              const data = JSON.parse(cot.datos_entrega);
              return (
                <div 
                  key={cot.id_cotizacion} 
                  onClick={() => setRutaSeleccionada({ ...cot, direccion: data.direccion, telefono: data.telefono })}
                  style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: rutaSeleccionada?.id_cotizacion === cot.id_cotizacion ? '#eff6ff' : '#fff' }}
                >
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0284c7' }}>{cot.numero_cotizacion}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#0f172a' }}>{cot.cliente_nombre}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>📍 {data.direccion.substring(0, 30)}...</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '500px' }}>
        {rutaSeleccionada ? (
          <div>
            <div style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.9rem' }}>
              <strong>Cliente:</strong> {rutaSeleccionada.cliente_nombre} <br/>
              <strong>Dirección:</strong> {rutaSeleccionada.direccion} <br/>
              <strong>Teléfono:</strong> {rutaSeleccionada.telefono}
            </div>
            
            {/* 🔥 IFRAME DE GOOGLE MAPS (Sin necesidad de API Key) */}
            <iframe
              width="100%"
              height="450"
              style={{ border: 0, borderRadius: '8px' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?saddr=${encodeURIComponent(SUCURSAL_AGROLACTEC)}&daddr=${encodeURIComponent(rutaSeleccionada.direccion)}&output=embed`}
            ></iframe>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            👈 Selecciona un pedido para ver la ruta.
          </div>
        )}
      </div>
    </div>
  );
}