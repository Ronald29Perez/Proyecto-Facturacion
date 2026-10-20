// ============================================================================
// PÁGINA PRINCIPAL / DASHBOARD CENTRAL - ERP AGROLACTEC
// Ubicación: app/page.tsx
// BD: v3.0 — usa todos los controladores y modelos nuevos
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';

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

type TabActiva =
  | 'CATALOGO'
  | 'PRODUCTOS'
  | 'LOTES'
  | 'DESPACHO'
  | 'FACTURACION'
  | 'USUARIOS';

export default function ERPDashboardPage() {
  // ==========================================================================
  // ESTADOS DE AUTENTICACIÓN
  // ==========================================================================
  const [usuarioActivo, setUsuarioActivo] = useState<SesionUsuario | null>(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  // ==========================================================================
  // ESTADOS DE DATOS
  // ==========================================================================
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

  // ==========================================================================
  // NAVEGACIÓN
  // ==========================================================================
  const [tabActiva, setTabActiva] = useState<TabActiva>('CATALOGO');

  // ==========================================================================
  // EFECTO INICIAL
  // ==========================================================================
  useEffect(() => {
    const sesion = cargarSesion();
    setUsuarioActivo(sesion);
    setVerificandoSesion(false);
    if (sesion) {
      cargarDatosServidor();
    }
  }, []);

  // ==========================================================================
  // CARGA DE DATOS EN PARALELO
  // ==========================================================================
  const cargarDatosServidor = async () => {
    setCargando(true);
    try {
      const [cats, subs, provs, prods, lots, cots, ords, ctas, usrs] =
        await Promise.all([
          obtenerCategorias(),
          obtenerSubcategorias(),
          obtenerProveedores(),
          obtenerProductosCatalogo(),
          obtenerLotesOrdenadosFIFO(),
          obtenerCotizacionesPendientes(),
          obtenerOrdenesPorFacturar(),
          obtenerCuentasBancarias(),
          obtenerUsuarios(),
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
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
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
    cantidad_disponible: number;
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

  // ==========================================================================
  // RENDER: CARGANDO SESIÓN
  // ==========================================================================
  if (verificandoSesion) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'system-ui' }}>
        <h2>🧀 Cargando AgroLactec ERP...</h2>
        <p style={{ color: '#64748b' }}>Verificando credenciales de acceso...</p>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: LOGIN
  // ==========================================================================
  if (!usuarioActivo) {
    return <LoginForm onLoginExitoso={handleLoginExitoso} />;
  }

  // ==========================================================================
  // RENDER: PORTAL CLIENTE
  // ==========================================================================
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

  // ==========================================================================
  // RENDER: DASHBOARD ADMIN
  // ==========================================================================
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#f1f5f9',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <header
        style={{
          backgroundColor: '#1e293b',
          color: '#ffffff',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8' }}>
            🧀 AgroLactec ERP
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Usuario: <strong>{usuarioActivo.nombre_completo}</strong> ({usuarioActivo.rol})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={cargarDatosServidor}
            disabled={cargando}
            style={{
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: cargando ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}
          >
            {cargando ? '🔄 Sincronizando...' : '🔄 Recargar Datos'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </header>

      {/* ================================================================== */}
      {/* TABS */}
      {/* ================================================================== */}
      <nav
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          backgroundColor: '#ffffff',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'CATALOGO', label: '🛍️ Catálogo' },
          { key: 'PRODUCTOS', label: '📝 Ficha de Producto' },
          { key: 'LOTES', label: '📦 Entradas Bodega (Lotes)' },
          { key: 'DESPACHO', label: `⚡ Despacho FIFO (${cotizacionesPendientes.length})` },
          { key: 'FACTURACION', label: `🧾 Facturación (${ordenesPorFacturar.length})` },
          { key: 'USUARIOS', label: `👥 Usuarios (${usuarios.length})` },
        ].map((tab) => (
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
              backgroundColor: tabActiva === tab.key ? '#2563eb' : 'transparent',
              color: tabActiva === tab.key ? '#ffffff' : '#64748b',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ================================================================== */}
      {/* CONTENIDO DINÁMICO */}
      {/* ================================================================== */}
      <main
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '15px',
          border: '1px solid #cbd5e1',
        }}
      >
        {tabActiva === 'CATALOGO' && (
          <CatalogoCliente
            productos={productos.filter((p) => p.activo !== false)}
            categorias={categorias}
          />
        )}

        {tabActiva === 'PRODUCTOS' && (
          <RegistroProducto
            productos={productos}
            categorias={categorias}
            subcategorias={subcategorias}  // 🔥 NUEVO
            proveedores={proveedores}
            onRefrescarDatos={cargarDatosServidor}
          />
        )}

        {tabActiva === 'LOTES' && (
          <GestionLotes
            productos={productos}
            lotes={lotes}
            onGuardarLote={handleGuardarLote}
          />
        )}

        {tabActiva === 'DESPACHO' && (
          <OrdenDespacho
            cotizacionesPendientes={cotizacionesPendientes}
            onProcesarDespachoFIFO={handleProcesarDespachoFIFO}
          />
        )}

        {tabActiva === 'FACTURACION' && (
          <ComprobanteFiscal
            ordenesPorFacturar={ordenesPorFacturar}
            cuentasBancarias={cuentasBancarias}
            onGenerarComprobante={handleGenerarComprobante}
          />
        )}

        {tabActiva === 'USUARIOS' && (
          <GestionUsuarios
            usuarios={usuarios}
            onRefrescarUsuarios={cargarDatosServidor}
          />
        )}
      </main>
    </div>
  );
}