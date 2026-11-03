// ============================================================================
// PÁGINA PRINCIPAL / DASHBOARD CENTRAL - ERP AGROLACTEC
// Ubicación: app/page.tsx
// BD: v3.5 — Iconos profesionales (Lucide) + Animación de carga
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  ShoppingCart, FileText, Package, Zap, Receipt, Users, 
  BarChart3, Map, LogOut, RefreshCw, Loader2, ShieldAlert 
} from 'lucide-react';

// ----------------------------------------------------------------------------
// 1. MODELOS
// ----------------------------------------------------------------------------
import {
  ProductoEntity,
  CategoriaEntity,
  SubcategoriaEntity,
  ProveedorEntity,
  LoteEntity,
  CotizacionEntity,
  OrdenDespachoEntity,
  CuentaBancariaEntity,
  Usuario,
} from '../models/agrolactec';

// ----------------------------------------------------------------------------
// 2. COMPONENTES
// ----------------------------------------------------------------------------
import LoginForm from '../components/auth/LoginForm';
import CatalogoCliente from '../components/catalogo/CatalogoCliente';
import RegistroProducto from '../components/inventario/RegistroProducto';
import GestionLotes from '../components/inventario/GestionLotes';
import OrdenDespacho from '../components/despacho/OrdenDespacho';
import ComprobanteFiscal from '../components/facturacion/ComprobanteFiscal';
import GestionUsuarios from '../components/usuarios/GestionUsuarios';
import VistaClientePedido from '../components/cliente/VistaClientePedido';
import HistorialReportes from '../components/reportes/HistorialReportes';
import MonitoreoRuta from '../components/rutas/MonitoreoRuta';

// ----------------------------------------------------------------------------
// 3. CONTROLADORES
// ----------------------------------------------------------------------------
import { cargarSesion, guardarSesion, cerrarSesion, SesionUsuario } from '../controllers/authController';

import {
  obtenerCategorias,
  obtenerSubcategorias,
  obtenerProveedores,
  obtenerProductosCatalogo,
} from '../controllers/productoController';

import { obtenerCotizacionesPendientes } from '../controllers/cotizacionController';

import {
  obtenerLotesOrdenadosFIFO,
  registrarNuevoLote,
  procesarDespachoCotizacionFIFO,
} from '../controllers/despachoController';

import {
  obtenerOrdenesPorFacturar,
  obtenerCuentasBancarias,
  emitirComprobanteFiscal,
} from '../controllers/facturaController';

import { obtenerUsuarios } from '../controllers/usuarioController';

import { 
  obtenerHistorialCotizaciones, 
  obtenerHistorialDespachos, 
  obtenerHistorialFacturas 
} from '../controllers/reporteController';

type TabActiva =
  | 'CATALOGO'
  | 'PRODUCTOS'
  | 'LOTES'
  | 'DESPACHO'
  | 'FACTURACION'
  | 'USUARIOS'
  | 'REPORTES'
  | 'RUTAS';

const TABS_PERMITIDAS: Record<string, string[]> = {
  ADMINISTRADOR: ['CATALOGO', 'PRODUCTOS', 'LOTES', 'DESPACHO', 'FACTURACION', 'USUARIOS', 'REPORTES', 'RUTAS'],
  GERENTE:       ['CATALOGO', 'LOTES', 'DESPACHO', 'FACTURACION', 'REPORTES', 'RUTAS'],
  BODEGA:        ['CATALOGO', 'LOTES', 'DESPACHO', 'RUTAS'],
  CAJERO:        ['CATALOGO', 'FACTURACION', 'REPORTES'],
  VENDEDOR:      ['CATALOGO', 'LOTES', 'REPORTES'],
  CLIENTE:       [],
};

export default function ERPDashboardPage() {
  const [usuarioActivo, setUsuarioActivo] = useState<SesionUsuario | null>(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  const [categorias, setCategorias] = useState<CategoriaEntity[]>([]);
  const [subcategorias, setSubcategorias] = useState<SubcategoriaEntity[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorEntity[]>([]);
  const [productos, setProductos] = useState<ProductoEntity[]>([]);
  const [lotes, setLotes] = useState<LoteEntity[]>([]);
  const [cotizacionesPendientes, setCotizacionesPendientes] = useState<CotizacionEntity[]>([]);
  const [ordenesPorFacturar, setOrdenesPorFacturar] = useState<OrdenDespachoEntity[]>([]);
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancariaEntity[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);

  const [historialCotizaciones, setHistorialCotizaciones] = useState<any[]>([]);
  const [historialDespachos, setHistorialDespachos] = useState<any[]>([]);
  const [historialFacturas, setHistorialFacturas] = useState<any[]>([]);

  const [tabActiva, setTabActiva] = useState<TabActiva>('CATALOGO');

  useEffect(() => {
    const sesion = cargarSesion();
    setUsuarioActivo(sesion);
    setVerificandoSesion(false);
    if (sesion) {
      cargarDatosServidor();
    }
  }, []);

  const cargarDatosServidor = async () => {
    setCargando(true);
    try {
      const [
        cats, subs, provs, prods, lots, cots, ords, ctas, usrs,
        histCots, histDesps, histFacs
      ] = await Promise.all([
        obtenerCategorias(),
        obtenerSubcategorias(),
        obtenerProveedores(),
        obtenerProductosCatalogo(),
        obtenerLotesOrdenadosFIFO(),
        obtenerCotizacionesPendientes(),
        obtenerOrdenesPorFacturar(),
        obtenerCuentasBancarias(),
        obtenerUsuarios(),
        obtenerHistorialCotizaciones(),
        obtenerHistorialDespachos(),
        obtenerHistorialFacturas(),
      ]);

      setCategorias(cats || []);
      setSubcategorias(subs || []);
      setProveedores(provs || []);
      setProductos(prods || []);
      setLotes(lots || []);
      setCotizacionesPendientes(cots || []);
      setOrdenesPorFacturar(ords || []);
      setCuentasBancarias(ctas || []);
      setUsuarios(usrs || []);
      
      setHistorialCotizaciones(histCots || []);
      setHistorialDespachos(histDesps || []);
      setHistorialFacturas(histFacs || []);
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    cerrarSesion();
    setUsuarioActivo(null);
  };

  const handleLoginExitoso = async (usr: SesionUsuario) => {
    guardarSesion(usr);
    setUsuarioActivo(usr);
    await cargarDatosServidor();
  };

  const handleGuardarLote = async (nuevoLote: {
    id_producto: string;
    codigo_lote: string;
    fecha_vencimiento: string;
    cantidad_ingresada: number;
  }) => {
    const res = await registrarNuevoLote(nuevoLote);
    alert(res.message);
    if (res.success) {
      await cargarDatosServidor();
    }
  };

  const handleProcesarDespachoFIFO = async (idCotizacion: string) => {
    const res = await procesarDespachoCotizacionFIFO(idCotizacion);
    if (res.success) {
      await cargarDatosServidor();
    }
    return res;
  };

  const handleGenerarComprobante = async (datos: {
    id_orden: string;
    tipo_comprobante: 'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL';
    condicion_pago: 'CONTADO' | 'CREDITO_15_DIAS' | 'CREDITO_30_DIAS';
    metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';
    id_cuenta_bancaria?: string;
    numero_comprobante?: string;
  }) => {
    const res = await emitirComprobanteFiscal(datos);
    if (res.success) {
      await cargarDatosServidor();
    }
    return res;
  };

  // 1. Pantalla de carga inicial
  if (verificandoSesion) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', fontFamily: 'system-ui' }}>
        <Image src="/img/logo-agrolactec.png" alt="AgroLactec Logo" width={180} height={70} style={{ objectFit: 'contain', marginBottom: '20px' }} />
        <Loader2 size={40} color="#0284c7" className="animate-spin" style={{ marginBottom: '15px' }} />
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>Cargando Sistema...</h2>
        <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Verificando credenciales y sincronizando datos</p>
      </div>
    );
  }

  // 2. Login
  if (!usuarioActivo) {
    return <LoginForm onLoginExitoso={handleLoginExitoso} />;
  }

  // 3. Portal del Cliente
  if (usuarioActivo.rol === 'CLIENTE') {
    return (
      <VistaClientePedido
        usuario={{
          id_usuario: usuarioActivo.id_usuario,
          nombre_completo: usuarioActivo.nombre_completo,
          username: usuarioActivo.username,
          password_hash: '',
          rol: usuarioActivo.rol,
          activo: usuarioActivo.activo,
        }}
        productos={productos}
        categorias={categorias}
        onCerrarSesion={handleLogout}
      />
    );
  }

  // 4. 🔥 Pantalla de carga POST-login (Mientras se traen los datos)
  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', fontFamily: 'system-ui' }}>
        <Image src="/img/logo-agrolactec.png" alt="AgroLactec Logo" width={180} height={70} style={{ objectFit: 'contain', marginBottom: '20px' }} />
        <Loader2 size={40} color="#0284c7" className="animate-spin" style={{ marginBottom: '15px' }} />
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>Bienvenido</h2>
        <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Preparando tu panel de control...</p>
      </div>
    );
  }

  // 5. Menú de Pestañas con Iconos
  const tabsVisibles = [
    { key: 'CATALOGO', label: 'Catálogo', icon: <ShoppingCart size={18} /> },
    { key: 'PRODUCTOS', label: 'Ficha de Producto', icon: <FileText size={18} /> },
    { key: 'LOTES', label: 'Entradas Bodega', icon: <Package size={18} /> },
    { key: 'DESPACHO', label: `Despacho FIFO (${cotizacionesPendientes.length})`, icon: <Zap size={18} /> },
    { key: 'FACTURACION', label: `Facturación (${ordenesPorFacturar.length})`, icon: <Receipt size={18} /> },
    { key: 'USUARIOS', label: `Usuarios (${usuarios.length})`, icon: <Users size={18} /> },
    { key: 'REPORTES', label: 'Reportes', icon: <BarChart3 size={18} /> },
    { key: 'RUTAS', label: 'Rutas', icon: <Map size={18} /> },
  ].filter(tab => TABS_PERMITIDAS[usuarioActivo.rol]?.includes(tab.key));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#1e293b', color: '#ffffff', padding: '20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '140px', height: '40px', position: 'relative' }}>
            <Image src="/img/logo-agrolactec.png" alt="AgroLactec Logo" fill style={{ objectFit: 'contain', objectPosition: 'left' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8' }}>AgroLactec ERP</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Usuario: <strong>{usuarioActivo.nombre_completo}</strong> ({usuarioActivo.rol})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={cargarDatosServidor} disabled={cargando} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} /> Recargar Datos
          </button>
          <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </header>

      {/* NAVEGACIÓN */}
      <nav style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', overflowX: 'auto' }}>
        {tabsVisibles.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTabActiva(tab.key as TabActiva)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: tabActiva === tab.key ? '#2563eb' : 'transparent',
              color: tabActiva === tab.key ? '#ffffff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CONTENIDO */}
      <main style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '15px', border: '1px solid #cbd5e1' }}>
        {!TABS_PERMITIDAS[usuarioActivo.rol]?.includes(tabActiva) ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>
            <ShieldAlert size={48} style={{ margin: '0 auto 16px' }} />
            <h2>Acceso Denegado</h2>
            <p>Tu rol ({usuarioActivo.rol}) no tiene permisos para ver este módulo.</p>
          </div>
        ) : (
          <>
            {tabActiva === 'CATALOGO' && (
              <VistaClientePedido
                usuario={{
                  id_usuario: usuarioActivo.id_usuario,
                  nombre_completo: usuarioActivo.nombre_completo,
                  username: usuarioActivo.username,
                  password_hash: '',
                  rol: usuarioActivo.rol,
                  activo: usuarioActivo.activo,
                }}
                productos={productos}
                categorias={categorias}
                onCerrarSesion={() => {}} 
              />
            )}

            {tabActiva === 'PRODUCTOS' && (
              <RegistroProducto productos={productos} categorias={categorias} subcategorias={subcategorias} proveedores={proveedores} onRefrescarDatos={cargarDatosServidor} />
            )}

            {tabActiva === 'LOTES' && (
              <GestionLotes productos={productos} lotes={lotes} onGuardarLote={handleGuardarLote} />
            )}

            {tabActiva === 'DESPACHO' && (
              <OrdenDespacho cotizacionesPendientes={cotizacionesPendientes} onProcesarDespachoFIFO={handleProcesarDespachoFIFO} />
            )}

            {tabActiva === 'FACTURACION' && (
              <ComprobanteFiscal ordenesPorFacturar={ordenesPorFacturar} cuentasBancarias={cuentasBancarias} onGenerarComprobante={handleGenerarComprobante} />
            )}

            {tabActiva === 'USUARIOS' && (
              <GestionUsuarios usuarios={usuarios} onRefrescarUsuarios={cargarDatosServidor} />
            )}

            {tabActiva === 'REPORTES' && (
              <HistorialReportes cotizaciones={historialCotizaciones} despachos={historialDespachos} facturas={historialFacturas} />
            )}

            {tabActiva === 'RUTAS' && (
              <MonitoreoRuta cotizaciones={historialCotizaciones} />
            )}
          </>
        )}
      </main>
    </div>
  );
}