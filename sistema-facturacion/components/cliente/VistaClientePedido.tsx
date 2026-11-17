// ============================================================================
// COMPONENTE: PORTAL DE PEDIDOS CLIENTE (RESPONSIVE Y VALIDADO)
// Ubicación: components/cliente/VistaClientePedido.tsx
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { 
  ShoppingCart, LogOut, Search, Plus, Trash2, Send, 
  CheckCircle, CreditCard, Building2, ArrowLeft, ShieldCheck, Lock, Package, Truck
} from 'lucide-react';
import { ProductoEntity, CategoriaEntity, Usuario, ResumenCarrito, ItemCarrito as ItemCarritoModel } from '../../models/agrolactec';
import { crearCotizacionDesdeCarrito } from '../../controllers/cotizacionController';
import ubicaciones from '../../lib/ubicaciones.json';

// ============================================================================
// 1. TIPOS E INTERFACES
// ============================================================================
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

// ============================================================================
// 2. COMPONENTE PRINCIPAL
// ============================================================================
export default function VistaClientePedido({
  usuario,
  productos,
  categorias,
  onCerrarSesion,
}: Props) {
  
  // --- ESTADOS DE NAVEGACIÓN Y UI ---
  const [vista, setVista] = useState<'CATALOGO' | 'MIS_PEDIDOS'>('CATALOGO');
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- ESTADOS DEL CARRITO ---
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('');
  const [carrito, setCarrito] = useState<ItemCarritoUI[]>([]);
  const [tipoVenta, setTipoVenta] = useState<'B2C_HOGAR' | 'B2B_COMERCIO'>('B2C_HOGAR');

  // --- ESTADOS DEL FORMULARIO (CLIENTE) ---
  const [nombreCliente, setNombreCliente] = useState(usuario.nombre_completo);
  const [razonSocial, setRazonSocial] = useState('');
  const [nit, setNit] = useState('');
  const [nrc, setNrc] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [departamentoSel, setDepartamentoSel] = useState('');
  const [municipioSel, setMunicipioSel] = useState('');
  const [detalleDireccion, setDetalleDireccion] = useState('');
  const [enviando, setEnviando] = useState(false);

  // --- ESTADOS DEL FLUJO DE PAGO ---
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [cotizacionCreada, setCotizacionCreada] = useState<any>(null);
  const [metodoPago, setMetodoPago] = useState<'TARJETA' | 'TRANSFERENCIA' | null>(null);
  const [procesandoPago, setProcesandoPago] = useState(false);

  // --- ESTADOS DE TARJETA ---
  const [numTarjeta, setNumTarjeta] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvc, setCvc] = useState('');
  const [nombreTarjeta, setNombreTarjeta] = useState('');
  const [errorPago, setErrorPago] = useState('');

  // --- ESTADOS DE HISTORIAL ---
  const [misPedidos, setMisPedidos] = useState<any[]>([]);

  // ============================================================================
  // 3. LÓGICA DE DATOS Y FILTROS
  // ============================================================================
  const cargarMisPedidos = async () => {
    const { data } = await supabase
      .from('cotizaciones')
      .select(`*, cotizacion_detalles (*)`) 
      .eq('cliente_nombre', usuario.nombre_completo)
      .order('fecha_emision', { ascending: false });
    setMisPedidos(data || []);
  };

  useEffect(() => {
    if (vista === 'MIS_PEDIDOS') cargarMisPedidos();
  }, [vista]);

  const productosActivos = productos.filter((p) => {
    if (p.activo === false) return false;
    const term = busqueda.toLowerCase().trim();
    const nombre = (p.nombre || '').toLowerCase();
    const code = (p.item_code || '').toLowerCase();
    const coincideTexto = nombre.includes(term) || code.includes(term);
    const coincideCat = categoriaSel === '' || p.id_categoria === categoriaSel;
    return coincideTexto && coincideCat;
  });

  const municipiosDisponibles = ubicaciones.find(u => u.departamento === departamentoSel)?.municipios || [];
  const totalPedido = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  // ============================================================================
  // 4. MANEJO DEL CARRITO
  // ============================================================================
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

  // ============================================================================
  // 5. LÓGICA DE VALIDACIÓN Y CONFIRMACIÓN DE PEDIDO
  // ============================================================================
  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- BLOQUE DE VALIDACIÓN ESTRICTA (A PRUEBA DE BALAS) ---
    if (carrito.length === 0) {
      return alert('⚠️ El carrito está vacío. Agrega productos antes de continuar.');
    }
    if (!nombreCliente.trim()) {
      return alert('⚠️ El campo "Nombre" es obligatorio.');
    }
    if (!emailCliente.trim()) {
      return alert('⚠️ El campo "Correo Electrónico" es obligatorio.');
    }
    
    // Validación estricta de correo
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailCliente)) {
      return alert('⚠️ El correo no tiene un formato válido (debe ser ejemplo@dominio.com).');
    }

    if (!telefonoCliente.trim()) {
      return alert('⚠️ El campo "Teléfono" es obligatorio.');
    }

    // Validación estricta de teléfono
    const telefonoRegex = /^[0-9\s-]{8,15}$/;
    if (!telefonoRegex.test(telefonoCliente)) {
      return alert('⚠️ El teléfono debe tener entre 8 y 15 caracteres y solo contener números y guiones.');
    }

    if (!departamentoSel || !municipioSel || !detalleDireccion.trim()) {
      return alert('⚠️ Debes completar toda la información de ubicación y dirección de entrega.');
    }

    if (tipoVenta === 'B2B_COMERCIO' && (!nit.trim() || !nrc.trim() || !razonSocial.trim())) {
      return alert('⚠️ Completa los datos fiscales B2B (Razón Social, NIT y NRC).');
    }

    // Si el código llega aquí, TODO está correcto.
    setEnviando(true);
    try {
      const direccionCompleta = `${detalleDireccion}, ${municipioSel}, ${departamentoSel}, El Salvador`;

      // 1. Guardar o actualizar el cliente
      await supabase.from('clientes').upsert({
        tipo: tipoVenta, 
        nombre: nombreCliente, 
        telefono: telefonoCliente,
        email: emailCliente, 
        direccion: direccionCompleta,
      }, { onConflict: 'email' });

      // 2. Armar resumen de cotización
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
        direccion: direccionCompleta, 
        email: emailCliente,
        ...(tipoVenta === 'B2B_COMERCIO' ? { razon_social: razonSocial, nit, nrc } : {})
      });

      // 3. Crear cotización
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

  // ============================================================================
  // 6. LÓGICA DE PAGO
  // ============================================================================
  const handlePagarTarjeta = async () => {
    setErrorPago('');
    const tarjetaLimpia = numTarjeta.replace(/\s/g, '');
    if (tarjetaLimpia.length !== 16 || isNaN(Number(tarjetaLimpia))) return setErrorPago('El número de tarjeta debe tener 16 dígitos válidos.');
    const [mes, anio] = vencimiento.split('/');
    if (!mes || !anio || mes.length !== 2 || anio.length !== 2) return setErrorPago('El formato de vencimiento debe ser MM/YY.');
    if (cvc.length !== 3 || isNaN(Number(cvc))) return setErrorPago('El código CVC debe tener 3 dígitos.');
    if (nombreTarjeta.trim().length < 5) return setErrorPago('Ingresa el nombre como aparece en la tarjeta.');
    await handleConfirmarPago();
  };

  const handleConfirmarPago = async () => {
    if (!cotizacionCreada) return;
    setProcesandoPago(true);
    try {
      const { data: cotDB } = await supabase.from('cotizaciones').select('id_cotizacion').eq('numero_cotizacion', cotizacionCreada.numero_cotizacion).single();
      if (!cotDB) throw new Error('No se encontró la cotización.');
      
      const { error } = await supabase.from('cotizaciones').update({ estado: 'PAGADO' }).eq('id_cotizacion', cotDB.id_cotizacion);
      if (error) throw error;

      try {
        await fetch('/api/enviar-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailCliente, nombreCliente, numeroPedido: cotizacionCreada.numero_cotizacion,
            total: cotizacionCreada.total || totalPedido,
            productos: carrito.map(c => ({ cantidad: c.cajas > 0 ? c.cajas : c.unidades, nombre: c.producto.nombre, precio: c.subtotal }))
          })
        });
      } catch (e) { console.error('Error enviando correo:', e); }

      alert('✅ ¡Pago procesado con éxito! Revisa tu correo.');
      setCarrito([]); setCotizacionCreada(null); setMetodoPago(null); setPaso(1); setVista('MIS_PEDIDOS'); 
    } catch (err: any) {
      alert(`❌ Error al procesar pago: ${err.message}`);
    } finally {
      setProcesandoPago(false);
    }
  };

  // ============================================================================
  // 7. RENDERIZADO DE LA INTERFAZ (JSX)
  // ============================================================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* --- SECCIÓN: HEADER --- */}
      {usuario.rol === 'CLIENTE' && (
        <header style={{ backgroundColor: '#0284c7', color: '#fff', padding: '12px 16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '4px 8px' }}>
              <Image src="/img/logo-agrolactec.png" alt="AgroLactec" width={80} height={24} style={{ objectFit: 'contain' }} priority />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Portal</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#e0f2fe' }}>Hola, {usuario.nombre_completo.split(' ')[0]}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setVista('CATALOGO')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderBottom: vista === 'CATALOGO' ? '2px solid #fff' : '2px solid transparent', paddingBottom: '2px' }}>Catálogo</button>
            <button onClick={() => setVista('MIS_PEDIDOS')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', borderBottom: vista === 'MIS_PEDIDOS' ? '2px solid #fff' : '2px solid transparent', paddingBottom: '2px' }}>Pedidos</button>
            <button onClick={onCerrarSesion} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>Salir</button>
          </div>
        </header>
      )}

      {vista === 'CATALOGO' && (
        <>
          {/* --- SECCIÓN: INDICADOR DE PASOS --- */}
          <div style={{ backgroundColor: '#fff', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            {[{ num: 1, label: 'Armar Pedido' }, { num: 2, label: 'Confirmación' }, { num: 3, label: 'Pago' }].map((s) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: paso >= s.num ? '#0284c7' : '#94a3b8', fontWeight: 'bold' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: paso >= s.num ? '#0284c7' : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{s.num}</div>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {/* --- SECCIÓN: PASO 1 (CATÁLOGO Y CARRITO) --- */}
          {paso === 1 && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
              
              <div style={{ flex: isMobile ? 'none' : 2, width: '100%' }}>
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                  <select value={categoriaSel} onChange={(e) => setCategoriaSel(e.target.value)} style={{ flex: isMobile ? 'none' : 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', minWidth: '150px' }}>
                    <option value="">Todas las Categorías</option>
                    {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {productosActivos.map((p) => (
                    <TarjetaProductoCliente key={p.id_producto} producto={p} onAgregar={handleAgregarAlCarrito} />
                  ))}
                </div>
              </div>

              <div style={{ flex: isMobile ? 'none' : 1, width: '100%', minWidth: isMobile ? '100%' : '320px' }}>
                <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', height: 'fit-content', position: isMobile ? 'static' : 'sticky', top: '20px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <ShoppingCart size={20} color="#0284c7" /> Tu Pedido
                  </h3>
                  {carrito.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Aún no has agregado productos.</p>
                  ) : (
                    <div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0', maxHeight: '200px', overflowY: 'auto' }}>
                        {carrito.map((item) => (
                          <li key={item.producto.id_producto} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            <div>
                              <strong style={{ fontSize: '0.85rem', display: 'block', lineHeight: 1.2 }}>{item.producto.nombre}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.cajas > 0 && `${item.cajas} caja(s) `}{item.unidades > 0 && `${item.unidades} und(s)`}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: '#16a34a', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>${item.subtotal.toFixed(2)}</strong>
                              <button onClick={() => handleEliminarDelCarrito(item.producto.id_producto)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>Total:</span>
                        <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>${totalPedido.toFixed(2)}</strong>
                      </div>
                    </div>
                  )}

                  {/* --- SECCIÓN: FORMULARIO --- */}
                  <form onSubmit={handleConfirmarPedido} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <select value={tipoVenta} onChange={(e) => setTipoVenta(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <option value="B2C_HOGAR">Detalle (B2C)</option>
                      <option value="B2B_COMERCIO">Mayoreo (B2B)</option>
                    </select>
                    
                    <input type="text" placeholder="Nombre *" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                    
                    {tipoVenta === 'B2B_COMERCIO' && (
                      <>
                        <input type="text" placeholder="Razón Social *" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" placeholder="NIT *" value={nit} onChange={(e) => setNit(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                          <input type="text" placeholder="NRC *" value={nrc} onChange={(e) => setNrc(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                        </div>
                      </>
                    )}

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Correo Electrónico *</label>
                      <input 
                        type="email" 
                        placeholder="ejemplo@correo.com" 
                        value={emailCliente} 
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9.@_+-]/g, '');
                          setEmailCliente(val);
                        }} 
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Teléfono *</label>
                      <input 
                        type="tel" 
                        placeholder="Ej: 7777-8888" 
                        value={telefonoCliente} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9\s-]/g, '');
                          setTelefonoCliente(val);
                        }} 
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Ubicación de Entrega</span>
                      <select value={departamentoSel} onChange={(e) => { setDepartamentoSel(e.target.value); setMunicipioSel(''); }} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                        <option value="">-- Departamento --</option>
                        {ubicaciones.map((ubi, index) => (
                          <option key={index} value={ubi.departamento}>{ubi.departamento}</option>
                        ))}
                      </select>
                      <select value={municipioSel} onChange={(e) => setMunicipioSel(e.target.value)} disabled={!departamentoSel} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: !departamentoSel ? '#f1f5f9' : '#fff' }}>
                        <option value="">-- Municipio --</option>
                        {municipiosDisponibles.map((mun, index) => (
                          <option key={index} value={mun}>{mun}</option>
                        ))}
                      </select>
                      <textarea rows={2} placeholder="Dirección exacta (Calle, # Casa, Colonia) *" value={detalleDireccion} onChange={(e) => setDetalleDireccion(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', resize: 'none', fontSize: '0.85rem' }} />
                    </div>

                    <button type="submit" disabled={enviando || carrito.length === 0} style={{ backgroundColor: enviando || carrito.length === 0 ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: enviando || carrito.length === 0 ? 'not-allowed' : 'pointer', marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Send size={18} /> {enviando ? 'Procesando...' : 'Confirmar Pedido'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* --- SECCIÓN: PASO 2 (CONFIRMACIÓN) --- */}
          {paso === 2 && cotizacionCreada && (
             <div style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <CheckCircle size={50} color="#16a34a" style={{ margin: '0 auto 15px' }} />
              <h2 style={{ color: '#0f172a', marginTop: 0, fontSize: '1.3rem' }}>¡Pedido Registrado!</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Tu pedido <strong>{cotizacionCreada.numero_cotizacion}</strong> ha sido creado exitosamente.</p>
              <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #fcd34d', margin: '15px 0' }}>
                <p style={{ margin: 0, color: '#92400e', fontWeight: 'bold' }}>Total: ${cotizacionCreada.total?.toFixed(2) || totalPedido.toFixed(2)}</p>
              </div>
              <button onClick={() => setPaso(3)} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                <CreditCard size={20} /> Ir a Pagar
              </button>
            </div>
          )}

          {/* --- SECCIÓN: PASO 3 (PAGO) --- */}
          {paso === 3 && (
            <div style={{ maxWidth: '500px', margin: '20px auto', padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <h2 style={{ textAlign: 'center', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <ShieldCheck size={24} color="#16a34a" /> Pago Seguro
              </h2>
              <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>
                Total a pagar: <strong>${cotizacionCreada?.total?.toFixed(2) || totalPedido.toFixed(2)}</strong>
              </p>
              {!metodoPago ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => setMetodoPago('TARJETA')} style={{ padding: '15px', border: '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CreditCard size={24} color="#0284c7" />
                    <div><strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9rem' }}>Tarjeta de Crédito</strong><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Visa, Mastercard</span></div>
                  </button>
                  <button onClick={() => setMetodoPago('TRANSFERENCIA')} style={{ padding: '15px', border: '2px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={24} color="#f59e0b" />
                    <div><strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9rem' }}>Transferencia</strong><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Depósito en cuenta</span></div>
                  </button>
                </div>
              ) : (
                <div>
                  <button onClick={() => setMetodoPago(null)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px', fontSize: '0.85rem' }}>
                    <ArrowLeft size={14} /> Volver
                  </button>
                  {metodoPago === 'TARJETA' && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {errorPago && <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '10px', fontWeight: 'bold' }}>⚠️ {errorPago}</div>}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input type="text" placeholder="0000 0000 0000 0000" maxLength={19} value={numTarjeta} onChange={(e) => setNumTarjeta(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input type="text" placeholder="MM/YY" maxLength={5} value={vencimiento} onChange={(e) => { let val = e.target.value.replace(/\D/g, ''); if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4); setVencimiento(val); }} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                          <input type="text" placeholder="CVC" maxLength={3} value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                        </div>
                        <input type="text" placeholder="Nombre en tarjeta" value={nombreTarjeta} onChange={(e) => setNombreTarjeta(e.target.value.toUpperCase())} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                        <button onClick={handlePagarTarjeta} disabled={procesandoPago} style={{ width: '100%', padding: '12px', marginTop: '5px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: procesandoPago ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <Lock size={16} /> {procesandoPago ? 'Procesando...' : `Pagar $${cotizacionCreada?.total?.toFixed(2) || totalPedido.toFixed(2)}`}
                        </button>
                      </div>
                    </div>
                  )}
                  {metodoPago === 'TRANSFERENCIA' && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#0f172a', fontSize: '0.9rem' }}>Deposita a cuenta:</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0', fontSize: '0.85rem' }}>
                        <li><strong>Banco:</strong> Agrícola</li>
                        <li><strong>Cuenta:</strong> 1234-5678</li>
                        <li><strong>Titular:</strong> AgroLactec</li>
                      </ul>
                      <button onClick={handleConfirmarPago} disabled={procesandoPago} style={{ width: '100%', padding: '12px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {procesandoPago ? 'Confirmando...' : 'Ya transferí'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* --- SECCIÓN: VISTA MIS PEDIDOS --- */}
      {vista === 'MIS_PEDIDOS' && (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '16px' }}>
          <h2 style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem' }}>
            <Package size={24} color="#0284c7" /> Mis Pedidos
          </h2>
          <p style={{ color: '#64748b', marginBottom: '15px', fontSize: '0.9rem' }}>Historial de compras.</p>
          {misPedidos.length === 0 ? (
            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>No hay pedidos.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {misPedidos.map((pedido) => {
                let badgeColor = { bg: '#fef3c7', text: '#b45309', label: 'Pendiente' };
                if (pedido.estado === 'PAGADO') badgeColor = { bg: '#dcfce7', text: '#15803d', label: 'Pagado' };
                if (pedido.estado === 'APROBADO_DESPACHO') badgeColor = { bg: '#e0f2fe', text: '#0369a1', label: 'Despachado' };
                if (pedido.estado === 'FACTURADO') badgeColor = { bg: '#f3e8ff', text: '#6b21a8', label: 'Facturado' };
                const pasosEstado = ['PENDIENTE', 'PAGADO', 'APROBADO_DESPACHO', 'FACTURADO'];
                const indiceActual = pasosEstado.indexOf(pedido.estado);
                const fechaPedido = new Date(pedido.fecha_emision);
                const fechaEstimada = new Date(fechaPedido);
                fechaEstimada.setDate(fechaEstimada.getDate() + 2);
                const fechaEntregaStr = fechaEstimada.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' });

                return (
                  <div key={pedido.id_cotizacion} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>N° de Pedido</span>
                        <strong style={{ color: '#0284c7', fontSize: '1rem' }}>{pedido.numero_cotizacion}</strong>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '8px' }}>{new Date(pedido.fecha_emision).toLocaleDateString()}</span>
                        <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: '#eff6ff', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Truck size={14} color="#0284c7" />
                          <span style={{ fontSize: '0.75rem', color: '#1e3a8a' }}><strong>Entrega:</strong> {fechaEntregaStr}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-end', gap: '10px', width: isMobile ? '100%' : 'auto', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', display: 'block', textAlign: isMobile ? 'left' : 'right' }}>Total</span>
                          <strong style={{ color: '#16a34a', fontSize: '1rem' }}>${Number(pedido.total).toFixed(2)}</strong>
                        </div>
                        <span style={{ backgroundColor: badgeColor.bg, color: badgeColor.text, padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {badgeColor.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                        {['Recibido', 'Pagado', 'Despachado', 'Facturado'].map((label, index) => {
                          const isActive = index <= indiceActual;
                          return (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '70px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }}>
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: isActive ? '#16a34a' : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                  {isActive ? <CheckCircle size={12} /> : index + 1}
                                </div>
                                <span style={{ fontSize: '0.6rem', color: isActive ? '#16a34a' : '#94a3b8', fontWeight: 'bold', textAlign: 'center' }}>{label}</span>
                              </div>
                              {index < 3 && (
                                <div style={{ height: '2px', flex: 1, backgroundColor: index < indiceActual ? '#16a34a' : '#e2e8f0', margin: '0 5px' }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>Productos:</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem' }}>
                        {pedido.cotizacion_detalles?.map((item: any) => (
                          <li key={item.id_detalle} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#64748b' }}>
                            <span>{item.cantidad}x {item.nombre_producto}</span>
                            <span style={{ fontWeight: 'bold', color: '#0f172a' }}>${Number(item.subtotal_item).toFixed(2)}</span>
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

// ============================================================================
// 8. SUBCOMPONENTE: TARJETA PRODUCTO
// ============================================================================
function TarjetaProductoCliente({ producto, onAgregar }: { producto: ProductoEntity; onAgregar: (prod: ProductoEntity, cajas: number, unidades: number) => void; }) {
  const [cajas, setCajas] = useState(0);
  const [unidades, setUnidades] = useState(1);

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ height: '100px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {producto.imagen_url ? <img src={producto.imagen_url} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ShoppingCart size={24} color="#cbd5e1" />}
        </div>
        <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 4px', borderRadius: '4px' }}>{producto.item_code}</span>
        <h4 style={{ margin: '4px 0', fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.2 }}>{producto.nombre}</h4>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#16a34a', fontWeight: 'bold' }}>${Number(producto.precio_b2c || 0).toFixed(2)} / Und</p>
      </div>

      <div style={{ marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.6rem', color: '#64748b' }}>Cajas:</label>
            <input type="number" min={0} value={cajas} onChange={(e) => setCajas(Number(e.target.value))} style={{ width: '100%', padding: '4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.6rem', color: '#64748b' }}>Unids:</label>
            <input type="number" min={0} value={unidades} onChange={(e) => setUnidades(Number(e.target.value))} style={{ width: '100%', padding: '4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>
        <button onClick={() => onAgregar(producto, cajas, unidades)} style={{ width: '100%', backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <Plus size={14} /> Agregar
        </button>
      </div>
    </div>
  );
}