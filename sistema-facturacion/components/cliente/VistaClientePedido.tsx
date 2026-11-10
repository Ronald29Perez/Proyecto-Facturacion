// ============================================================================
// COMPONENTE: PORTAL DE PEDIDOS CLIENTE
// Ubicación: components/cliente/VistaClientePedido.tsx
// BD: v3.9 — Flujo de 3 pasos + Historial de Pedidos con Barra de Progreso
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { 
  ShoppingCart, LogOut, Search, Plus, Trash2, Send, 
  CheckCircle, CreditCard, Building2, ArrowLeft, ShieldCheck, Lock, Package, ShoppingBag
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
  // --- Estados de Navegación ---
  const [vista, setVista] = useState<'CATALOGO' | 'MIS_PEDIDOS'>('CATALOGO');
  const [misPedidos, setMisPedidos] = useState<any[]>([]);

  // --- Estados del Carrito ---
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

  // --- Estados del Flujo de Pago ---
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [cotizacionCreada, setCotizacionCreada] = useState<any>(null);
  const [metodoPago, setMetodoPago] = useState<'TARJETA' | 'TRANSFERENCIA' | null>(null);
  const [procesandoPago, setProcesandoPago] = useState(false);

  // --- Estados para los datos de la tarjeta ---
  const [numTarjeta, setNumTarjeta] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvc, setCvc] = useState('');
  const [nombreTarjeta, setNombreTarjeta] = useState('');
  const [errorPago, setErrorPago] = useState('');

  // -------------------------------------------------------------------------
  // CARGAR MIS PEDIDOS
  // -------------------------------------------------------------------------
  const cargarMisPedidos = async () => {
    const { data } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cotizacion_detalles (*) 
      `) 
      .eq('cliente_nombre', usuario.nombre_completo)
      .order('fecha_emision', { ascending: false });
    setMisPedidos(data || []);
  };

  useEffect(() => {
    if (vista === 'MIS_PEDIDOS') {
      cargarMisPedidos();
    }
  }, [vista]);

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
    if (cajas <= 0 && unidades <= 0) return alert('Ingresa al menos 1 caja o 1 unidad.');
    
    const precioUnitario = prod.precio_b2c || 0;
    const precioCaja = prod.precio_b2b || 0;
    const subtotal = unidades * precioUnitario + cajas * precioCaja;

    const index = carrito.findIndex((item) => item.producto.id_producto === prod.id_producto);
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
  // PASO 1: CONFIRMAR COTIZACIÓN
  // -------------------------------------------------------------------------
  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    if (carrito.length === 0) return alert('El carrito está vacío.');
    if (!nombreCliente || !telefonoCliente || !direccionEntrega) return alert('Completa nombre, teléfono y dirección.');
    if (tipoVenta === 'B2B_COMERCIO' && (!nit || !nrc || !razonSocial)) return alert('Completa los datos fiscales B2B.');

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
        telefono: telefonoCliente, direccion: direccionEntrega,
        ...(tipoVenta === 'B2B_COMERCIO' ? { razon_social: razonSocial, nit, nrc } : {})
      });

      const resultado = await crearCotizacionDesdeCarrito(resumen, nombreCliente, tipoVenta, undefined, datosEntregaJSON);

      if (!resultado.success) throw new Error(resultado.message);

      setCotizacionCreada(resultado);
      setPaso(2);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  // -------------------------------------------------------------------------
  // PASO 3: PROCESAR PAGO
  // -------------------------------------------------------------------------
  const handlePagarTarjeta = async () => {
    setErrorPago('');

    const tarjetaLimpia = numTarjeta.replace(/\s/g, '');
    if (tarjetaLimpia.length !== 16 || isNaN(Number(tarjetaLimpia))) {
      return setErrorPago('El número de tarjeta debe tener 16 dígitos válidos.');
    }

    const [mes, anio] = vencimiento.split('/');
    if (!mes || !anio || mes.length !== 2 || anio.length !== 2) {
      return setErrorPago('El formato de vencimiento debe ser MM/YY.');
    }
    const mesNum = Number(mes);
    if (mesNum < 1 || mesNum > 12) {
      return setErrorPago('El mes de vencimiento es inválido.');
    }
    
    if (cvc.length !== 3 || isNaN(Number(cvc))) {
      return setErrorPago('El código CVC debe tener 3 dígitos.');
    }

    if (nombreTarjeta.trim().length < 5) {
      return setErrorPago('Por favor ingresa el nombre como aparece en la tarjeta.');
    }

    await handleConfirmarPago();
  };

  const handleConfirmarPago = async () => {
    if (!cotizacionCreada) return;
    setProcesandoPago(true);

    try {
      const { data: cotDB } = await supabase
        .from('cotizaciones')
        .select('id_cotizacion')
        .eq('numero_cotizacion', cotizacionCreada.numero_cotizacion)
        .single();

      if (!cotDB) throw new Error('No se encontró la cotización.');

      const { error } = await supabase
        .from('cotizaciones')
        .update({ estado: 'PAGADO' })
        .eq('id_cotizacion', cotDB.id_cotizacion);

      if (error) throw error;

      alert('✅ ¡Pago procesado con éxito! Revisa el estado de tu pedido en "Mis Pedidos".');
      
      setCarrito([]);
      setCotizacionCreada(null);
      setMetodoPago(null);
      setPaso(1);
      setVista('MIS_PEDIDOS'); 

    } catch (err: any) {
      alert(`❌ Error al procesar pago: ${err.message}`);
    } finally {
      setProcesandoPago(false);
    }
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER CON NAVEGACIÓN */}
      {usuario.rol === 'CLIENTE' && (
        <header style={{ backgroundColor: '#0284c7', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/img/logo-agrolactec.png" alt="AgroLactec" width={110} height={30} style={{ objectFit: 'contain' }} priority />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Portal de Compras</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#e0f2fe' }}>
                Bienvenido, <strong>{usuario.nombre_completo}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button 
              onClick={() => setVista('CATALOGO')} 
              style={{ 
                background: 'none', border: 'none', color: '#fff', cursor: 'pointer', 
                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px',
                borderBottom: vista === 'CATALOGO' ? '3px solid #fff' : '3px solid transparent',
                paddingBottom: '5px'
              }}
            >
              <ShoppingBag size={18} /> Catálogo
            </button>
            <button 
              onClick={() => setVista('MIS_PEDIDOS')} 
              style={{ 
                background: 'none', border: 'none', color: '#fff', cursor: 'pointer', 
                fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px',
                borderBottom: vista === 'MIS_PEDIDOS' ? '3px solid #fff' : '3px solid transparent',
                paddingBottom: '5px'
              }}
            >
              <Package size={18} /> Mis Pedidos
            </button>
            <button onClick={onCerrarSesion} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </header>
      )}

      {/* ================================================================== */}
      {/* VISTA 1: CATÁLOGO Y FLUJO DE COMPRA                               */}
      {/* ================================================================== */}
      {vista === 'CATALOGO' && (
        <>
          {/* INDICADOR DE PASOS */}
          <div style={{ backgroundColor: '#fff', padding: '15px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', gap: '40px' }}>
            {[
              { num: 1, label: '1. Armar Pedido' },
              { num: 2, label: '2. Confirmación' },
              { num: 3, label: '3. Pago' }
            ].map((s) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: paso >= s.num ? '#0284c7' : '#94a3b8', fontWeight: 'bold' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: paso >= s.num ? '#0284c7' : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                  {s.num}
                </div>
                {s.label}
              </div>
            ))}
          </div>

          {/* PASO 1: CARRITO Y CATÁLOGO */}
          {paso === 1 && (
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              
              <div>
                <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                  <select value={categoriaSel} onChange={(e) => setCategoriaSel(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', minWidth: '180px' }}>
                    <option value="">Todas las Categorías</option>
                    {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
                  {productosActivos.map((p) => (
                    <TarjetaProductoCliente key={p.id_producto} producto={p} onAgregar={handleAgregarAlCarrito} />
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={20} color="#0284c7" /> Tu Pedido
                </h3>

                {carrito.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Aún no has agregado productos.</p>
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
                            <button onClick={() => handleEliminarDelCarrito(item.producto.id_producto)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '10px', marginBottom: '15px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>Total: </span>
                      <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>${totalPedido.toFixed(2)}</strong>
                    </div>
                  </div>
                )}

                <form onSubmit={handleConfirmarPedido} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Tipo de Compra</label>
                    <select value={tipoVenta} onChange={(e) => setTipoVenta(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <option value="B2C_HOGAR">Detalle (B2C)</option>
                      <option value="B2B_COMERCIO">Mayoreo (B2B)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>{tipoVenta === 'B2B_COMERCIO' ? 'Nombre Comercial *' : 'Nombre *'}</label>
                    <input type="text" required value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>

                  {tipoVenta === 'B2B_COMERCIO' && (
                    <>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Razón Social *</label>
                        <input type="text" required value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>NIT *</label><input type="text" required value={nit} onChange={(e) => setNit(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                        <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>NRC *</label><input type="text" required value={nrc} onChange={(e) => setNrc(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} /></div>
                      </div>
                    </>
                  )}

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Teléfono *</label>
                    <input type="text" required value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Dirección de Entrega *</label>
                    <textarea required rows={2} value={direccionEntrega} onChange={(e) => setDireccionEntrega(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>

                  <button type="submit" disabled={enviando || carrito.length === 0} style={{ backgroundColor: enviando || carrito.length === 0 ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: enviando || carrito.length === 0 ? 'not-allowed' : 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Send size={18} /> {enviando ? 'Procesando...' : 'Confirmar Pedido'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PASO 2: ESPERA DE CONFIRMACIÓN */}
          {paso === 2 && cotizacionCreada && (
            <div style={{ maxWidth: '600px', margin: '40px auto', padding: '40px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <CheckCircle size={64} color="#16a34a" style={{ margin: '0 auto 20px' }} />
              <h1 style={{ color: '#0f172a', marginTop: 0 }}>¡Pedido Registrado!</h1>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                Tu pedido <strong>{cotizacionCreada.numero_cotizacion}</strong> ha sido creado exitosamente.
              </p>
              <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #fcd34d', margin: '20px 0' }}>
                <p style={{ margin: 0, color: '#92400e', fontWeight: 'bold' }}>Total a pagar: ${cotizacionCreada.total?.toFixed(2) || totalPedido.toFixed(2)}</p>
              </div>
              <p style={{ color: '#64748b', marginBottom: '30px' }}>Para procesar el despacho, por favor completa el pago.</p>
              <button onClick={() => setPaso(3)} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '12px 30px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                <CreditCard size={20} /> Ir a Pagar
              </button>
            </div>
          )}

          {/* PASO 3: PASARELA DE PAGO */}
          {paso === 3 && (
            <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <h2 style={{ textAlign: 'center', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ShieldCheck size={28} color="#16a34a" /> Pago Seguro
              </h2>
              <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px' }}>
                Total a pagar: <strong>${cotizacionCreada?.total?.toFixed(2) || totalPedido.toFixed(2)}</strong>
              </p>

              {!metodoPago ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <button onClick={() => setMetodoPago('TARJETA')} style={{ padding: '20px', border: '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <CreditCard size={32} color="#0284c7" />
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a' }}>Tarjeta de Crédito/Débito</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Visa, Mastercard, Amex</span>
                    </div>
                  </button>
                  <button onClick={() => setMetodoPago('TRANSFERENCIA')} style={{ padding: '20px', border: '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Building2 size={32} color="#f59e0b" />
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a' }}>Transferencia Bancaria</strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Depósito en cuenta</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div>
                  <button onClick={() => setMetodoPago(null)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px' }}>
                    <ArrowLeft size={16} /> Volver a métodos de pago
                  </button>

                  {metodoPago === 'TARJETA' && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ShieldCheck size={24} color="#16a34a" />
                          <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1rem' }}>Pago Seguro</span>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <div style={{ backgroundColor: '#1a1f71', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold' }}>VISA</div>
                          <div style={{ backgroundColor: '#eb001b', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold' }}>MC</div>
                          <div style={{ backgroundColor: '#0070ba', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold' }}>AMEX</div>
                        </div>
                      </div>

                      {errorPago && (
                        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold' }}>
                          ⚠️ {errorPago}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Número de Tarjeta</label>
                          <div style={{ position: 'relative' }}>
                            <CreditCard size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                              type="text" 
                              placeholder="0000 0000 0000 0000" 
                              maxLength={19}
                              value={numTarjeta}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                setNumTarjeta(val);
                              }}
                              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'monospace' }} 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Vencimiento</label>
                            <input 
                              type="text" 
                              placeholder="MM/YY" 
                              maxLength={5}
                              value={vencimiento}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                setVencimiento(val);
                              }}
                              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'monospace' }} 
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>CVC</label>
                            <input 
                              type="text" 
                              placeholder="123" 
                              maxLength={3}
                              value={cvc}
                              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontFamily: 'monospace' }} 
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Nombre en la tarjeta</label>
                          <input 
                            type="text" 
                            placeholder="Como aparece en la tarjeta" 
                            value={nombreTarjeta}
                            onChange={(e) => setNombreTarjeta(e.target.value.toUpperCase())}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} 
                          />
                        </div>

                        <button 
                          onClick={handlePagarTarjeta}
                          disabled={procesandoPago} 
                          style={{ 
                            width: '100%', padding: '14px', marginTop: '10px',
                            backgroundColor: '#0f172a',
                            color: '#fff', 
                            border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: procesandoPago ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            fontSize: '1rem'
                          }}
                        >
                          <Lock size={18} />
                          {procesandoPago ? 'Procesando...' : `Pagar $${cotizacionCreada?.total?.toFixed(2) || totalPedido.toFixed(2)}`}
                        </button>

                        <p style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', margin: '5px 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} /> Tus datos están encriptados y seguros
                        </p>
                      </div>
                    </div>
                  )}

                  {metodoPago === 'TRANSFERENCIA' && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#0f172a' }}>Deposita a nuestra cuenta:</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0', fontSize: '0.9rem' }}>
                        <li><strong>Banco:</strong> Banco Agrícola</li>
                        <li><strong>Cuenta:</strong> 1234-5678-9012</li>
                        <li><strong>Titular:</strong> AgroLactec S.A. de C.V.</li>
                      </ul>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Luego de transferir, presiona el botón para confirmar tu pago (Simulado):</p>
                      <button onClick={handleConfirmarPago} disabled={procesandoPago} style={{ width: '100%', padding: '12px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {procesandoPago ? 'Confirmando...' : 'He realizado la transferencia'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ================================================================== */}
      {/* VISTA 2: MIS PEDIDOS                                              */}
      {/* ================================================================== */}
      {vista === 'MIS_PEDIDOS' && (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
          <h2 style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={28} color="#0284c7" /> Mis Pedidos
          </h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Historial de todas tus compras en AgroLactec.</p>

          {misPedidos.length === 0 ? (
            <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
              Aún no tienes pedidos registrados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {misPedidos.map((pedido) => {
                let badgeColor = { bg: '#fef3c7', text: '#b45309', label: 'Pendiente' };
                if (pedido.estado === 'PAGADO') badgeColor = { bg: '#dcfce7', text: '#15803d', label: 'Pagado' };
                if (pedido.estado === 'APROBADO_DESPACHO') badgeColor = { bg: '#e0f2fe', text: '#0369a1', label: 'Despachado' };
                if (pedido.estado === 'FACTURADO') badgeColor = { bg: '#f3e8ff', text: '#6b21a8', label: 'Facturado' };

                const pasosEstado = ['PENDIENTE', 'PAGADO', 'APROBADO_DESPACHO', 'FACTURADO'];
                const indiceActual = pasosEstado.indexOf(pedido.estado);

                return (
                  <div key={pedido.id_cotizacion} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    
                    {/* HEADER DE LA TARJETA */}
                    <div style={{ padding: '15px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', display: 'block' }}>N° de Pedido</span>
                        <strong style={{ color: '#0284c7', fontSize: '1.1rem' }}>{pedido.numero_cotizacion}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '10px' }}>{new Date(pedido.fecha_emision).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', display: 'block', textAlign: 'right' }}>Total</span>
                          <strong style={{ color: '#16a34a', fontSize: '1.1rem' }}>${Number(pedido.total).toFixed(2)}</strong>
                        </div>
                        <span style={{ backgroundColor: badgeColor.bg, color: badgeColor.text, padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {badgeColor.label}
                        </span>
                      </div>
                    </div>

                    {/* CONTENIDO DE LA TARJETA */}
                    <div style={{ padding: '20px' }}>
                      
                      {/* Barra de Progreso Visual */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        {['Recibido', 'Pagado', 'Despachado', 'Facturado'].map((label, index) => {
                          const isActive = index <= indiceActual;
                          return (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: isActive ? '#16a34a' : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {isActive ? <CheckCircle size={14} /> : <span style={{ fontSize: '0.7rem' }}>{index + 1}</span>}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: isActive ? '#16a34a' : '#94a3b8', fontWeight: 'bold' }}>{label}</span>
                              </div>
                              {index < 3 && (
                                <div style={{ flex: 1, height: '2px', backgroundColor: index < indiceActual ? '#16a34a' : '#e2e8f0', margin: '0 5px' }} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Lista de Productos */}
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569' }}>Productos:</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                        {pedido.cotizacion_detalles?.map((item: any) => (
                          <li key={item.id_detalle} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>{item.cantidad}x {item.nombre_producto}</span>
                            <span style={{ color: '#64748b' }}>${Number(item.subtotal_item).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENTE: TARJETA PRODUCTO
// ---------------------------------------------------------------------------
function TarjetaProductoCliente({ producto, onAgregar }: { producto: ProductoEntity; onAgregar: (prod: ProductoEntity, cajas: number, unidades: number) => void; }) {
  const [cajas, setCajas] = useState(0);
  const [unidades, setUnidades] = useState(1);

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ height: '120px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {producto.imagen_url ? <img src={producto.imagen_url} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ShoppingCart size={24} color="#cbd5e1" />}
        </div>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>{producto.item_code}</span>
        <h4 style={{ margin: '6px 0', fontSize: '0.95rem', color: '#0f172a' }}>{producto.nombre}</h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#16a34a', fontWeight: 'bold' }}>${Number(producto.precio_b2c || 0).toFixed(2)} / Und</p>
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