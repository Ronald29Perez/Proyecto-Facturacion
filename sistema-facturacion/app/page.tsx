// ============================================================================
// PÁGINA PRINCIPAL / DASHBOARD CENTRAL - ERP AGROLACTEC (COMPLETO Y CORREGIDO)
// Ubicación: app/page.tsx
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';

// ----------------------------------------------------------------------------
// 1. IMPORTACIÓN DE CONEXIÓN Y MODELOS
// ----------------------------------------------------------------------------
import { supabase } from '../lib/supabase';
import {
  ProductoEstructurado,
  Categoria,
  Proveedor,
  LoteEntity,
  CotizacionEntity,
  OrdenDespachoEntity,
  CuentaBancaria,
  Usuario,
} from '../models/agrolactec';

// ----------------------------------------------------------------------------
// 2. IMPORTACIÓN DE COMPONENTES DE INTERFAZ (VISTAS DEL ERP)
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
// 3. IMPORTACIÓN DE CONTROLADORES DE NEGOCIO
// ----------------------------------------------------------------------------
import { obtenerUsuarioActual, cerrarSesion } from '../controllers/authController';

import {
  obtenerCategorias,
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

export default function ERPDashboardPage() {
  // --------------------------------------------------------------------------
  // ESTADOS DE AUTENTICACIÓN Y NAVEGACIÓN
  // --------------------------------------------------------------------------
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | null>(null);
  const [verificandoSesion, setVerificandoSesion] = useState<boolean>(true);

  const [tabActiva, setTabActiva] = useState<
    'CATALOGO' | 'REGISTRO_PRODUCTO' | 'LOTES' | 'DESPACHO' | 'FACTURACION' | 'USUARIOS'
  >('CATALOGO');

  // --------------------------------------------------------------------------
  // ESTADOS DE DATOS DEL ERP (ALMACENAMIENTO EN MEMORIA)
  // --------------------------------------------------------------------------
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<ProductoEstructurado[]>([]);
  const [lotes, setLotes] = useState<LoteEntity[]>([]);
  const [cotizacionesPendientes, setCotizacionesPendientes] = useState<CotizacionEntity[]>([]);
  const [ordenesPorFacturar, setOrdenesPorFacturar] = useState<OrdenDespachoEntity[]>([]);
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // EFECTO INICIAL: COMPROBACIÓN DE SESIÓN Y CARGA DE DATOS
  // --------------------------------------------------------------------------
  useEffect(() => {
    async function chequearSesion() {
      const usr = await obtenerUsuarioActual();
      setUsuarioActivo(usr);
      setVerificandoSesion(false);

      if (usr) {
        await cargarDatosServidor();
      }
    }
    chequearSesion();
  }, []);

  /**
   * Carga sincrónica y en paralelo de todas las entidades del ERP desde Supabase
   */
  const cargarDatosServidor = async () => {
    setCargando(true);
    try {
      const [
        cats,
        provs,
        prods,
        lots,
        cots,
        ords,
        ctas,
        usrs,
      ] = await Promise.all([
        obtenerCategorias(),
        obtenerProveedores(),
        obtenerProductosCatalogo(),
        obtenerLotesOrdenadosFIFO(),
        obtenerCotizacionesPendientes(),
        obtenerOrdenesPorFacturar(),
        obtenerCuentasBancarias(),
        obtenerUsuarios(),
      ]);

      // Actualización masiva del estado de React
      setCategorias(cats || []);
      setProveedores(provs || []);
      setProductos(prods || []);
      setLotes(lots || []);
      setCotizacionesPendientes(cots || []);
      setOrdenesPorFacturar(ords || []);
      setCuentasBancarias(ctas || []);
      setUsuarios(usrs || []);
    } catch (error) {
      console.error('Error al sincronizar datos con el servidor:', error);
    } finally {
      setCargando(false);
    }
  };

  // --------------------------------------------------------------------------
  // MANEJADORES DE ACCIONES Y EVENTOS DEL USUARIO
  // --------------------------------------------------------------------------
  const handleLogout = async () => {
    await cerrarSesion();
    setUsuarioActivo(null);
  };

  const handleGuardarLote = async (nuevoLote: {
    id_producto: string;
    codigo_lote: string;
    fecha_vencimiento: string;
    cajas_ingresadas: number;
    unidades_disponibles: number;
  }) => {
    const res = await registrarNuevoLote(nuevoLote);
    if (res.success) {
      alert(res.message);
      await cargarDatosServidor();
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const handleProcesarDespachoFIFO = async (idCotizacion: string) => {
    const res = await procesarDespachoCotizacionFIFO(idCotizacion);
    if (res.success) {
      await cargarDatosServidor();
    }
    return res;
  };

  const handleGenerarComprobante = async (datosComprobante: any) => {
    const res = await emitirComprobanteFiscal(datosComprobante);
    if (res.success) {
      await cargarDatosServidor();
    }
    return res;
  };

  // --------------------------------------------------------------------------
  // RENDERIZADO CONDICIONAL 1: PANTALLA DE CARGA INICIAL
  // --------------------------------------------------------------------------
  if (verificandoSesion) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'system-ui' }}>
        <h2>🧀 Cargando AgroLactec ERP...</h2>
        <p style={{ color: '#64748b' }}>Verificando credenciales de acceso...</p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDERIZADO CONDICIONAL 2: FORMULARIO DE INICIO DE SESIÓN
  // --------------------------------------------------------------------------
  if (!usuarioActivo) {
    return (
      <LoginForm
        onLoginExitoso={async (usr) => {
          setUsuarioActivo(usr);
          await cargarDatosServidor();
        }}
      />
    );
  }

// CONDICIONAL ROL CLIENTE EXCLUSIVO
if (usuarioActivo.rol?.nombre_rol?.toLowerCase() === 'cliente') {
  return (
    <VistaClientePedido
      usuario={usuarioActivo}
      productos={productos}
      categorias={categorias}
      onCerrarSesion={handleLogout}
    />
  );
}

  // --------------------------------------------------------------------------
  // RENDERIZADO PRINCIPAL: PANEL DERECHO Y PESTAÑAS DEL ERP
  // --------------------------------------------------------------------------
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '20px' }}>
      {/* ENCABEZADO SUPERIOR CON INFORMACIÓN DE USUARIO Y LOGOUT */}
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8' }}>🧀 AgroLactec ERP</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Usuario: <strong>{usuarioActivo.nombre_completo}</strong> ({usuarioActivo.rol?.nombre_rol || 'Usuario'})
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

      {/* BARRA DE NAVEGACIÓN POR PESTAÑAS (TABS) */}
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
        <button
          onClick={() => setTabActiva('CATALOGO')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            backgroundColor: tabActiva === 'CATALOGO' ? '#2563eb' : 'transparent',
            color: tabActiva === 'CATALOGO' ? '#ffffff' : '#64748b',
          }}
        >
          🛍️ Catálogo y Carrito
        </button>

        <button
          onClick={() => setTabActiva('REGISTRO_PRODUCTO')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            backgroundColor: tabActiva === 'REGISTRO_PRODUCTO' ? '#2563eb' : 'transparent',
            color: tabActiva === 'REGISTRO_PRODUCTO' ? '#ffffff' : '#64748b',
          }}
        >
          📝 Ficha de Producto
        </button>

        <button
          onClick={() => setTabActiva('LOTES')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            backgroundColor: tabActiva === 'LOTES' ? '#2563eb' : 'transparent',
            color: tabActiva === 'LOTES' ? '#ffffff' : '#64748b',
          }}
        >
          📦 Entradas Bodega (Lotes)
        </button>

        <button
          onClick={() => setTabActiva('DESPACHO')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            backgroundColor: tabActiva === 'DESPACHO' ? '#2563eb' : 'transparent',
            color: tabActiva === 'DESPACHO' ? '#ffffff' : '#64748b',
          }}
        >
          ⚡ Despacho FIFO ({cotizacionesPendientes.length})
        </button>

        <button
          onClick={() => setTabActiva('FACTURACION')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            backgroundColor: tabActiva === 'FACTURACION' ? '#2563eb' : 'transparent',
            color: tabActiva === 'FACTURACION' ? '#ffffff' : '#64748b',
          }}
        >
          🧾 Facturación & Cobro ({ordenesPorFacturar.length})
        </button>

        <button
          onClick={() => setTabActiva('USUARIOS')}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            backgroundColor: tabActiva === 'USUARIOS' ? '#2563eb' : 'transparent',
            color: tabActiva === 'USUARIOS' ? '#ffffff' : '#64748b',
          }}
        >
          👥 Gestión de Usuarios ({usuarios.length})
        </button>
      </nav>

      {/* ÁREA DE CONTENIDO DINÁMICO SEGÚN PESTAÑA ACTIVA */}
      <main style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '15px', border: '1px solid #cbd5e1' }}>
        {tabActiva === 'CATALOGO' && (
          <CatalogoCliente
            productos={productos.filter((p) => p.activo !== false)}
            categorias={categorias}
          />
        )}

        {tabActiva === 'REGISTRO_PRODUCTO' && (
          <RegistroProducto
            productos={productos}
            categorias={categorias}
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