// ============================================================================
// PÁGINA PRINCIPAL / DASHBOARD CENTRAL - ERP AGROLACTEC
// Ubicación: app/page.tsx
// BD: v3.6 — Dashboard Integrado + RBAC
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  ShoppingCart, FileText, Package, Zap, Receipt, Users, 
  BarChart3, Map, LogOut, RefreshCw, Loader2, ShieldAlert, LayoutDashboard 
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
import DashboardAdmin from '../components/dashboard/DashboardAdmin'; // 🔥 NUEVO

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
  obtenerHistorialFacturas,
  obtenerInventarioValorizado
} from '../controllers/reporteController';

import { obtenerDatosDashboard } from '../controllers/dashboardController'; // 🔥 NUEVO

type TabActiva =
  | 'DASHBOARD'
  | 'CATALOGO'
  | 'PRODUCTOS'
  | 'LOTES'
  | 'DESPACHO'
  | 'FACTURACION'
  | 'USUARIOS'
  | 'REPORTES'
  | 'RUTAS';

const TABS_PERMITIDAS: Record<string, string[]> = {
  ADMINISTRADOR: ['DASHBOARD', 'CATALOGO', 'PRODUCTOS', 'LOTES', 'DESPACHO', 'FACTURACION', 'USUARIOS', 'REPORTES', 'RUTAS'],
  GERENTE:       ['DASHBOARD', 'LOTES', 'DESPACHO', 'FACTURACION', 'REPORTES', 'RUTAS'],
  BODEGA:        ['LOTES', 'DESPACHO', 'RUTAS', 'REPORTES'],
  CAJERO:        ['FACTURACION', 'REPORTES'],
  VENDEDOR:      ['CATALOGO', 'LOTES', 'REPORTES'],
  MOTORISTA:     ['RUTAS'],
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
  
  const [historialCotizaciones, setHistorialCotizaciones] = useState<any[]>([]);
  const [historialDespachos, setHistorialDespachos] = useState<any[]>([]);
  const [historialFacturas, setHistorialFacturas] = useState<any[]>([]);
  
  const [dashboardData, setDashboardData] = useState<any>(null); // 🔥 NUEVO
  const [inventario, setInventario] = useState<any[]>([]);
  const [valorTotalBodega, setValorTotalBodega] = useState(0);
  const [totalCajas, setTotalCajas] = useState(0);
  const [cargando, setCargando] = useState(false);

  const [tabActiva, setTabActiva] = useState<TabActiva>('DASHBOARD'); // 🔥 Iniciamos en Dashboard

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
        histCots, histDesps, histFacs, dData, dataInventario
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
        obtenerDatosDashboard(), 
        obtenerInventarioValorizado(),// 🔥 NUEVO
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
      
      setDashboardData(dData); // 🔥 NUEVO
      setInventario(dataInventario.inventario || []);
      setValorTotalBodega(dataInventario.valorTotalBodega || 0);
      setTotalCajas(dataInventario.totalCajas || 0);
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
    
    // Si es gerente o admin, que inicie en Dashboard
    setTabActiva(usr.rol === 'ADMINISTRADOR' || usr.rol === 'GERENTE' ? 'DASHBOARD' : 'CATALOGO');
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
        <Image 
  src="/img/logo-agrolactec.png" 
  alt="AgroLactec Logo" 
  width={140} 
  height={40} 
  priority={true} // 🔥 Le dice a Next.js que cargue esta imagen de inmediato
/>
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

  // 4. Pantalla de carga POST-login
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
    { key: 'DASHBOARD', label: 'Inicio', icon: <LayoutDashboard size={18} /> },
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
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      
      {/* HEADER COMPACTO Y HORIZONTAL */}
      <header className="bg-slate-800 text-white shadow-md sticky top-0 z-50 flex flex-col">
        {/* Fila 1: Logo, Usuario y Botones de Acción (Siempre en una línea) */}
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-16 h-8 relative bg-white rounded p-0.5 shrink-0">
              <Image src="/img/logo-agrolactec.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div className="min-w-0">
              <h1 className="m-0 text-sm md:text-lg text-sky-400 font-bold leading-tight truncate">AgroLactec</h1>
              <p className="m-0 text-[10px] md:text-xs text-slate-300 truncate">
                {usuarioActivo.nombre_completo} ({usuarioActivo.rol})
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button onClick={cargarDatosServidor} disabled={cargando} className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white p-2 rounded flex items-center justify-center transition-colors">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded flex items-center justify-center transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Fila 2: Pestañas con scroll horizontal (No se apilan, se deslizan) */}
        <div className="w-full overflow-x-auto border-t border-slate-700 bg-slate-800/50">
          <nav className="flex gap-1 px-2 py-2 min-w-max">
            {tabsVisibles.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTabActiva(tab.key as TabActiva)}
                className={`px-3 py-2 rounded-md font-bold text-xs md:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                  tabActiva === tab.key 
                    ? 'bg-sky-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 md:p-6 overflow-hidden">
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 p-2 md:p-6 min-h-[80vh]">
          {!TABS_PERMITIDAS[usuarioActivo.rol]?.includes(tabActiva) ? (
            <div className="text-center py-20 px-4 text-red-500">
              <ShieldAlert size={64} className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Acceso Denegado</h2>
              <p className="text-slate-500 mt-2">Tu rol ({usuarioActivo.rol}) no tiene permisos para ver este módulo.</p>
            </div>
          ) : (
            <>
              {tabActiva === 'DASHBOARD' && <DashboardAdmin datos={dashboardData} />}

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
                <HistorialReportes cotizaciones={historialCotizaciones} despachos={historialDespachos} facturas={historialFacturas} inventario={inventario} valorTotalBodega={valorTotalBodega} totalCajas={totalCajas} rolUsuario={usuarioActivo.rol} onRefrescar={cargarDatosServidor} />
              )}

              {tabActiva === 'RUTAS' && (
                <MonitoreoRuta cotizaciones={historialCotizaciones} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}