// ============================================================================
// COMPONENTE: PORTAL DE PEDIDOS CLIENTE
// Ubicación: components/cliente/VistaClientePedido.tsx
// BD: v3.4 — Logo, Iconos profesionales, Fotos y Diseño Responsivo
// ============================================================================

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  ShoppingCart, LogOut, Search, Plus, Trash2, Send 
} from 'lucide-react';
import { ProductoEntity, CategoriaEntity, Usuario, ResumenCarrito, ItemCarrito as ItemCarritoModel } from '../../models/agrolactec';
import { crearCotizacionDesdeCarrito } from '../../controllers/cotizacionController';

interface ItemCarritoUI {
  producto: ProductoEntity;
  cajas: number;
  unidades: number;
  subtotal: number;
}

interface Props {
  usuario: Usuario;
  productos: ProductoEntity[];
  categorias: CategoriaEntity[];
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
  const [carrito, setCarrito] = useState<ItemCarritoUI[]>([]);
  const [tipoVenta, setTipoVenta] = useState<'B2C_HOGAR' | 'B2B_COMERCIO'>('B2C_HOGAR');
  
  const [nombreCliente, setNombreCliente] = useState(usuario.nombre_completo);
  const [razonSocial, setRazonSocial] = useState('');
  const [nit, setNit] = useState('');
  const [nrc, setNrc] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [enviando, setEnviando] = useState(false);

  // -------------------------------------------------------------------------
  // FILTRADO
  // -------------------------------------------------------------------------
  const productosActivos = productos.filter((p) => {
    if (p.activo === false) return false;
    const term = busqueda.toLowerCase().trim();
    const nombre = (p.nombre || '').toLowerCase();
    const code = (p.item_code || '').toLowerCase();
    const coincideTexto = nombre.includes(term) || code.includes(term);
    const coincideCat = categoriaSel === '' || p.id_categoria === categoriaSel;
    return coincideTexto && coincideCat;
  });

  // -------------------------------------------------------------------------
  // CARRITO
  // -------------------------------------------------------------------------
  const handleAgregarAlCarrito = (prod: ProductoEntity, cajas: number, unidades: number) => {
    if (cajas <= 0 && unidades <= 0) {
      alert('Ingresa al menos 1 caja o 1 unidad.');
      return;
    }

    const precioUnitario = prod.precio_b2c || 0;
    const precioCaja = prod.precio_b2b || 0;
    const subtotal = unidades * precioUnitario + cajas * precioCaja;

    const index = carrito.findIndex(
      (item) => item.producto.id_producto === prod.id_producto
    );

    if (index >= 0) {
      const nuevo = [...carrito];
      nuevo[index].cajas += cajas;
      nuevo[index].unidades += unidades;
      nuevo[index].subtotal += subtotal;
      setCarrito(nuevo);
    } else {
      setCarrito([...carrito, { producto: prod, cajas, unidades, subtotal }]);
    }
  };

  const handleEliminarDelCarrito = (id_producto: string) => {
    setCarrito(carrito.filter((item) => item.producto.id_producto !== id_producto));
  };

  const totalPedido = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  // -------------------------------------------------------------------------
  // CONFIRMAR COTIZACIÓN
  // -------------------------------------------------------------------------
  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    if (carrito.length === 0) {
      alert('El carrito está vacío. Selecciona al menos un producto.');
      return;
    }

    if (!nombreCliente || !telefonoCliente || !direccionEntrega) {
      alert('Por favor completa el nombre, el teléfono y la dirección de entrega.');
      return;
    }

    if (tipoVenta === 'B2B_COMERCIO' && (!nit || !nrc || !razonSocial)) {
      alert('Para mayoreo, la Razón Social, NIT y NRC son obligatorios.');
      return;
    }

    setEnviando(true);
    try {
      const subtotal = totalPedido;
      const iva = parseFloat((subtotal * 0.13).toFixed(2));
      const total = parseFloat((subtotal + iva).toFixed(2));

      const items: ItemCarritoModel[] = carrito.map((item) => ({
        producto: item.producto,
        unidad_medida: item.cajas > 0 && item.unidades === 0 ? 'CAJA' : 'UNIDAD',
        cantidad: item.cajas > 0 && item.unidades === 0 ? item.cajas : item.unidades,
        precio_unitario: item.cajas > 0 && item.unidades === 0 ? item.producto.precio_b2b : item.producto.precio_b2c,
        subtotal: item.subtotal,
      }));

      const resumen: ResumenCarrito = { items, subtotal, impuesto_iva: iva, total };

      const datosEntregaJSON = JSON.stringify({
        telefono: telefonoCliente,
        direccion: direccionEntrega,
        ...(tipoVenta === 'B2B_COMERCIO' ? { razon_social: razonSocial, nit, nrc } : {})
      });

      const resultado = await crearCotizacionDesdeCarrito(resumen, nombreCliente, tipoVenta, undefined, datosEntregaJSON);

      if (!resultado.success) {
        alert(`❌ ${resultado.message}`);
        return;
      }

      alert(`✅ ¡Tu cotización ${resultado.numero_cotizacion} ha sido enviada!\nUn asesor procesará tu despacho.`);

      setCarrito([]);
      setNombreCliente(usuario.nombre_completo);
      setTelefonoCliente('');
      setDireccionEntrega('');
      setRazonSocial('');
      setNit('');
      setNrc('');
      setTipoVenta('B2C_HOGAR');
    } catch (err: any) {
      console.error('Error al enviar pedido:', err.message);
      alert(`Ocurrió un error: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER (Solo visible para clientes reales) */}
      {usuario.rol === 'CLIENTE' && (
        <header style={{ backgroundColor: '#0284c7', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* LOGO */}
            <div style={{ 
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              padding: '4px 8px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Image 
                src="/img/logo-agrolactec.png" 
                alt="AgroLactec Logo" 
                width={110} 
                height={30} 
                style={{ objectFit: 'contain' }} 
              />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Portal de Compras</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#e0f2fe' }}>
                Bienvenido, <strong>{usuario.nombre_completo}</strong>
              </p>
            </div>
          </div>
          
          <button 
            onClick={onCerrarSesion} 
            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </header>
      )}

      {/* WORKSPACE */}
      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* CATÁLOGO */}
        <div>
          {/* BARRA DE BÚSQUEDA CORREGIDA */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Buscar queso, crema o producto..." 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
                style={{ 
                  width: '100%', 
                  boxSizing: 'border-box',
                  padding: '10px 10px 10px 35px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1' 
                }} 
              />
            </div>

            <select 
              value={categoriaSel} 
              onChange={(e) => setCategoriaSel(e.target.value)} 
              style={{ 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #cbd5e1', 
                backgroundColor: '#fff',
                minWidth: '180px'
              }}
            >
              <option value="">Todas las Categorías</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
            {productosActivos.map((p) => (
              <TarjetaProductoCliente key={p.id_producto} producto={p} onAgregar={handleAgregarAlCarrito} />
            ))}
          </div>
        </div>

        {/* CARRITO + FORM */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
          
          <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={20} color="#0284c7" />
            Tu Cotización / Pedido
          </h3>

          {carrito.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Aún no has agregado productos a tu cotización.</p>
          ) : (
            <div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0' }}>
                {carrito.map((item) => (
                  <li key={item.producto.id_producto} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>{item.producto.nombre}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {item.cajas > 0 && `${item.cajas} caja(s) `}
                        {item.unidades > 0 && `${item.unidades} und(s)`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#16a34a', fontSize: '0.9rem' }}>${item.subtotal.toFixed(2)}</strong>
                      <button onClick={() => handleEliminarDelCarrito(item.producto.id_producto)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                        <Trash2 size={16} />
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
              <select value={tipoVenta} onChange={(e) => setTipoVenta(e.target.value as 'B2C_HOGAR' | 'B2B_COMERCIO')} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                <option value="B2C_HOGAR">Detalle (B2C)</option>
                <option value="B2B_COMERCIO">Mayoreo / Cajas (B2B)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>
                {tipoVenta === 'B2B_COMERCIO' ? 'Nombre Comercial *' : 'Nombre del Cliente *'}
              </label>
              <input type="text" required placeholder={tipoVenta === 'B2B_COMERCIO' ? "Ej: Pupusería El Buen Gusto" : "Ej: María López"} value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
            </div>

            {tipoVenta === 'B2B_COMERCIO' && (
              <>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Razón Social *</label>
                  <input type="text" required placeholder="Ej: El Buen Gusto S.A. de C.V." value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>NIT *</label>
                    <input type="text" required placeholder="0614-123456-101-1" value={nit} onChange={(e) => setNit(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>NRC *</label>
                    <input type="text" required placeholder="123456-7" value={nrc} onChange={(e) => setNrc(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Teléfono de Contacto *</label>
              <input type="text" required placeholder="Ej: 7777-8888" value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Dirección de Entrega *</label>
              <textarea required rows={3} placeholder="Dirección exacta para enviar tu pedido..." value={direccionEntrega} onChange={(e) => setDireccionEntrega(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
            </div>

            <button type="submit" disabled={enviando || carrito.length === 0} style={{ 
              backgroundColor: enviando || carrito.length === 0 ? '#94a3b8' : '#16a34a', 
              color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', 
              cursor: enviando || carrito.length === 0 ? 'not-allowed' : 'pointer', marginTop: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              <Send size={18} />
              {enviando ? 'Enviando...' : 'Finalizar Cotización'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENTE: TARJETA PRODUCTO
// ---------------------------------------------------------------------------
function TarjetaProductoCliente({
  producto,
  onAgregar,
}: {
  producto: ProductoEntity;
  onAgregar: (prod: ProductoEntity, cajas: number, unidades: number) => void;
}) {
  const [cajas, setCajas] = useState(0);
  const [unidades, setUnidades] = useState(1);

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      <div>
        <div style={{ height: '120px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {producto.imagen_url ? (
            <img src={producto.imagen_url} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <ShoppingCart size={24} color="#cbd5e1" />
          )}
        </div>

        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
          {producto.item_code}
        </span>
        <h4 style={{ margin: '6px 0', fontSize: '0.95rem', color: '#0f172a' }}>{producto.nombre}</h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>
          ${Number(producto.precio_b2c || 0).toFixed(2)} / Und
        </p>
      </div>

      <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.65rem', color: '#64748b' }}>Cajas:</label>
            <input type="number" min={0} value={cajas} onChange={(e) => setCajas(Number(e.target.value))} style={{ width: '100%', padding: '4px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.65rem', color: '#64748b' }}>Unidades:</label>
            <input type="number" min={0} value={unidades} onChange={(e) => setUnidades(Number(e.target.value))} style={{ width: '100%', padding: '4px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <button onClick={() => onAgregar(producto, cajas, unidades)} style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Plus size={14} /> Agregar
        </button>
      </div>
    </div>
  );
}