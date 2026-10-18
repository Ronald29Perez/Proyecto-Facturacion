// ============================================================================
// COMPONENTE: PORTAL DE PEDIDOS CLIENTE (MAPEO CORREGIDO A 'cliente_tipo')
// Ubicación: components/cliente/VistaClientePedido.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import { ProductoEstructurado, Categoria, Usuario } from '../../models/agrolactec';
import { supabase } from '../../lib/supabase';

interface ItemCarrito {
  producto: ProductoEstructurado;
  cajas: number;
  unidades: number;
  subtotal: number;
}

interface Props {
  usuario: Usuario;
  productos: ProductoEstructurado[];
  categorias: Categoria[];
  onCerrarSesion: () => void;
}

export default function VistaClientePedido({
  usuario,
  productos,
  categorias,
  onCerrarSesion,
}: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [tipoVenta, setTipoVenta] = useState<'B2C' | 'B2B'>('B2C');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Filtrado dinámico de productos activos
  const productosActivos = productos.filter((p) => {
    if (p.activo === false) return false;
    const term = busqueda.toLowerCase().trim();
    const nombre = (p.nombre_producto || (p as any).nombre || '').toLowerCase();
    const code = (p.item_code || '').toLowerCase();
    const coincideTexto = nombre.includes(term) || code.includes(term);
    const coincideCat = categoriaSel === '' || p.id_categoria === categoriaSel;
    return coincideTexto && coincideCat;
  });

  // Agregar producto al carrito
  const handleAgregarAlCarrito = (prod: ProductoEstructurado, cajas: number, unidades: number) => {
    if (cajas <= 0 && unidades <= 0) {
      alert('Ingresa al menos 1 caja o 1 unidad.');
      return;
    }

    const precioUnitario = prod.precio_detalle || 0;
    const precioCaja = prod.precio_mayoreo || 0;
    const subtotal = (unidades * precioUnitario) + (cajas * precioCaja);

    const index = carrito.findIndex((item) => item.producto.id_producto === prod.id_producto);

    if (index >= 0) {
      const nuevoCarrito = [...carrito];
      nuevoCarrito[index].cajas += cajas;
      nuevoCarrito[index].unidades += unidades;
      nuevoCarrito[index].subtotal += subtotal;
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([...carrito, { producto: prod, cajas, unidades, subtotal }]);
    }
  };

  const handleEliminarDelCarrito = (id_producto: string) => {
    setCarrito(carrito.filter((item) => item.producto.id_producto !== id_producto));
  };

  const totalPedido = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  // Confirmar e insertar pedido en Supabase
  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    if (carrito.length === 0) {
      alert('El carrito está vacío. Selecciona al menos un producto.');
      return;
    }

    setEnviando(true);
    try {
      const idCotizacion = crypto.randomUUID();
      const numCotizacionGenerado = `COT-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Insertar la cotización vinculando 'cliente_tipo' en lugar de 'tipo_venta'
      const { error: errCot } = await supabase.from('cotizaciones').insert([
        {
          id_cotizacion: idCotizacion,
          numero_cotizacion: numCotizacionGenerado,
          cliente_nombre: usuario.nombre_completo,
          cliente_telefono: telefonoCliente,
          direccion_entrega: direccionEntrega,
          cliente_tipo: tipoVenta, // CORRECCIÓN: Se mapea a la columna 'cliente_tipo'
          total_venta: totalPedido,
          estado: 'PENDIENTE',
        },
      ]);

      if (errCot) throw errCot;

      // 2. Insertar los ítems del detalle
      const detallesInsertar = carrito.map((item) => ({
        id_detalle: crypto.randomUUID(),
        id_cotizacion: idCotizacion,
        id_producto: item.producto.id_producto,
        cantidad_cajas: item.cajas,
        cantidad_unidades: item.unidades,
        precio_aplicado: tipoVenta === 'B2B' ? item.producto.precio_mayoreo : item.producto.precio_detalle,
        subtotal: item.subtotal,
      }));

      const { error: errDet } = await supabase.from('detalle_cotizaciones').insert(detallesInsertar);

      if (errDet) throw errDet;

      alert(`✅ ¡Tu pedido ${numCotizacionGenerado} ha sido enviado con éxito! Un asesor procesará tu despacho.`);
      setCarrito([]);
      setTelefonoCliente('');
      setDireccionEntrega('');
    } catch (err: any) {
      console.error('Error al enviar pedido:', err.message); // Linea 131
      alert(`Ocurrió un error al procesar tu pedido: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* BARRA SUPERIOR EXCLUSIVA CLIENTE */}
      <header style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>🧀 AgroLactec - Portal de Compras</h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#e0f2fe' }}>
            Bienvenido, <strong>{usuario.nombre_completo}</strong>
          </p>
        </div>

        <button
          onClick={onCerrarSesion}
          style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🚪 Cerrar Sesión
        </button>
      </header>

      {/* ÁREA DE TRABAJO */}
      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* COLUMNA CATÁLOGOS */}
        <div>
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar queso, crema o producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <select
              value={categoriaSel}
              onChange={(e) => setCategoriaSel(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
            >
              <option value="">Todas las Categorías</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre_categoria}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
            {productosActivos.map((p) => (
              <TarjetaProductoCliente key={p.id_producto} producto={p} onAgregar={handleAgregarAlCarrito} />
            ))}
          </div>
        </div>

        {/* COLUMNA FORMULARIO Y CARRITO */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>🛒 Tu Cotización / Pedido</h3>

          {carrito.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Aún no has agregado productos a tu cotización.</p>
          ) : (
            <div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0' }}>
                {carrito.map((item) => (
                  <li key={item.producto.id_producto} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>{item.producto.nombre_producto}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {item.cajas > 0 && `${item.cajas} caja(s) `}
                        {item.unidades > 0 && `${item.unidades} und(s)`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#16a34a', fontSize: '0.9rem' }}>${item.subtotal.toFixed(2)}</strong>
                      <button
                        onClick={() => {
                          const idProducto = item.producto.id_producto;
                          if (idProducto !== undefined) handleEliminarDelCarrito(idProducto);
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '10px', marginBottom: '15px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>Total Estimado: </span>
                <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>${totalPedido.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <form onSubmit={handleConfirmarPedido} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Tipo de Compra</label>
              <select
                value={tipoVenta}
                onChange={(e) => setTipoVenta(e.target.value as 'B2C' | 'B2B')}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
              >
                <option value="B2C">Detalle (B2C)</option>
                <option value="B2B">Mayoreo / Cajas (B2B)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Teléfono de Contacto *</label>
              <input
                type="text"
                required
                placeholder="Ej: 7777-8888"
                value={telefonoCliente}
                onChange={(e) => setTelefonoCliente(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Dirección de Entrega *</label>
              <textarea
                required
                rows={3}
                placeholder="Dirección exacta para enviar tu pedido..."
                value={direccionEntrega}
                onChange={(e) => setDireccionEntrega(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <button
              type="submit"
              disabled={enviando || carrito.length === 0}
              style={{
                backgroundColor: enviando || carrito.length === 0 ? '#94a3b8' : '#16a34a',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: enviando || carrito.length === 0 ? 'not-allowed' : 'pointer',
                marginTop: '10px',
              }}
            >
              {enviando ? 'Enviando...' : '🚀 Finalizar Cotización'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Subcomponente de Tarjeta
function TarjetaProductoCliente({
  producto,
  onAgregar,
}: {
  producto: ProductoEstructurado;
  onAgregar: (prod: ProductoEstructurado, cajas: number, unidades: number) => void;
}) {
  const [cajas, setCajas] = useState(0);
  const [unidades, setUnidades] = useState(1);

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
          {producto.item_code}
        </span>
        <h4 style={{ margin: '6px 0', fontSize: '0.95rem', color: '#0f172a' }}>{producto.nombre_producto}</h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>
          ${Number(producto.precio_detalle || 0).toFixed(2)} / Und
        </p>
      </div>

      <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.65rem', color: '#64748b' }}>Cajas:</label>
            <input
              type="number"
              min={0}
              value={cajas}
              onChange={(e) => setCajas(Number(e.target.value))}
              style={{ width: '100%', padding: '4px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.65rem', color: '#64748b' }}>Unidades:</label>
            <input
              type="number"
              min={0}
              value={unidades}
              onChange={(e) => setUnidades(Number(e.target.value))}
              style={{ width: '100%', padding: '4px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        <button
          onClick={() => onAgregar(producto, cajas, unidades)}
          style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          ➕ Agregar
        </button>
      </div>
    </div>
  );
}