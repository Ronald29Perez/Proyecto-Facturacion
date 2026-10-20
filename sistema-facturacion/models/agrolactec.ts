// ============================================================================
// CONTRATOS DE DATOS E INTERFACES TYPESCRIPT (ERP AGROLACTEC v3.0)
// Ubicación: models/agrolactec.ts
// Alineado con la BD v3.0 de Supabase
// ============================================================================

// ----------------------------------------------------------------------------
// 1. MÓDULO DE AUTENTICACIÓN Y ROLES
// ----------------------------------------------------------------------------

export type RolUsuario = 
  | 'ADMINISTRADOR' 
  | 'GERENTE' 
  | 'BODEGA' 
  | 'CAJERO' 
  | 'VENDEDOR' 
  | 'CLIENTE';

export interface Usuario {
  id_usuario: string;
  nombre_completo: string;
  username: string;
  password_hash: string;      //  Solo backend
  rol: RolUsuario;
  activo: boolean;
  created_at?: string;
}

// ----------------------------------------------------------------------------
// 2. MÓDULO DE CLIENTES (B2C + B2B unificado)
// ----------------------------------------------------------------------------

export type ClienteTipo = 'B2C_HOGAR' | 'B2B_COMERCIO';

export interface ClienteEntity {
  id_cliente: string;
  tipo: ClienteTipo;
  
  // Datos básicos (siempre)
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  
  // Datos fiscales (solo B2B / al facturar CCF)
  razon_social?: string;
  nit?: string;
  nrc?: string;
  giro?: string;
  nombre_contacto?: string;
  
  activo: boolean;
  created_at?: string;
}

// Alias para compatibilidad
export type ClienteB2BEntity = ClienteEntity;
export type ClienteB2CEntity = ClienteEntity;

// ----------------------------------------------------------------------------
// 3. MÓDULO DE PROVEEDORES
// ----------------------------------------------------------------------------

export interface ProveedorEntity {
  id_proveedor: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo: boolean;
  created_at?: string;
}

// ----------------------------------------------------------------------------
// 4. MÓDULO DE CATÁLOGO (Categorías, Subcategorías, Productos)
// ----------------------------------------------------------------------------

export interface CategoriaEntity {
  id_categoria: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
  activa: boolean;
  created_at?: string;
}

export interface SubcategoriaEntity {
  id_subcategoria: string;
  id_categoria: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  created_at?: string;
}

export type UnidadMedida = 'CAJA' | 'UNIDAD' | 'LIBRA' | 'DOCENA' | 'PAQUETE';

export interface ProductoEntity {
  id_producto: string;
  item_code: string;
  nombre: string;
  
  // Jerarquía
  id_categoria: string;
  id_subcategoria?: string;
  id_proveedor?: string;
  
  // Datos técnicos
  nso?: string;
  descripcion?: string;
  unidad_medida: UnidadMedida;
  
  // Precios
  precio_b2c: number;
  precio_b2b: number;
  unidades_por_caja: number;
  
  // Imagen
  imagen_url?: string;
  
  // Estado
  activo: boolean;
  created_at?: string;
  
  // Relaciones (cargadas con JOIN)
  categorias?: CategoriaEntity;
  subcategorias?: SubcategoriaEntity;
  proveedores?: ProveedorEntity;
}

// Alias para compatibilidad con código existente
export type ProductoEstructurado = ProductoEntity;
export type ProductoCatalogo = ProductoEntity;

// ----------------------------------------------------------------------------
// 5. MÓDULO DE BODEGA Y LOTES (FIFO)
// ----------------------------------------------------------------------------

export interface LoteEntity {
  id_lote: string;
  id_producto: string;
  codigo_lote: string;
  fecha_ingreso: string;
  fecha_vencimiento: string;
  cantidad_disponible: number;   // Cambiado: antes era cajas_disponibles
  created_at?: string;
  
  // Relaciones
  productos?: ProductoEntity;
  
  // Campo calculado (opcional, para UI)
  estado_vencimiento?: 'NORMAL' | 'POR_VENCER' | 'VENCIDO';
}

// ----------------------------------------------------------------------------
// 6. MÓDULO DE CARRITO Y COTIZACIONES
// ----------------------------------------------------------------------------

export interface ItemCarrito {
  producto: ProductoEntity;
  unidad_medida: UnidadMedida;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface ResumenCarrito {
  items: ItemCarrito[];
  subtotal: number;
  impuesto_iva: number;
  total: number;
}

export interface CotizacionDetalleEntity {
  id_detalle: string;
  id_cotizacion: string;
  id_producto: string;
  nombre_producto: string;
  unidad_medida: UnidadMedida;
  cantidad: number;
  precio_unitario: number;
  subtotal_item: number;
}

export type EstadoCotizacion = 
  | 'PENDIENTE' 
  | 'APROBADO_DESPACHO' 
  | 'FACTURADO' 
  | 'CANCELADO';

export type CanalOrigen = 
  | 'WEB_CLIENTE_DIRECTO' 
  | 'TELEMARKETING' 
  | 'RUTA_VENTAS';

export interface CotizacionEntity {
  id_cotizacion: string;
  numero_cotizacion: string;
  fecha_emision: string;
  
  // Cliente
  cliente_tipo: ClienteTipo;
  cliente_nombre: string;
  id_cliente?: string;        // Cambiado: era id_cliente_b2b
  
  // Vendedor
  id_vendedor?: string;
  canal_origen: CanalOrigen;
  
  // Montos
  subtotal: number;
  impuesto_iva: number;
  total: number;
  
  // Estado
  estado: EstadoCotizacion;
  datos_entrega?: string;
  
  // Relaciones
  cotizacion_detalles?: CotizacionDetalleEntity[];
  detalles?: CotizacionDetalleEntity[];   // Alias
  clientes?: ClienteEntity;
}

// ----------------------------------------------------------------------------
// 7. MÓDULO DE ÓRDENES DE DESPACHO
// ----------------------------------------------------------------------------

export type EstadoOrdenDespacho = 'PENDIENTE' | 'PROCESADO' | 'FACTURADO';

export interface DespachoLoteDetalleEntity {
  id_despacho_detalle: string;
  id_orden: string;
  id_lote: string;
  cantidad_descontada: number;   //  Antes era cajas_descontadas + unidades_descontadas
  fecha_registro: string;
  
  // Relaciones
  lotes?: LoteEntity;
}

export interface OrdenDespachoEntity {
  id_orden: string;
  numero_orden: string;
  id_cotizacion: string;
  total_despachado: number;
  estado: EstadoOrdenDespacho;
  fecha_despacho: string;
  
  // Relaciones
  cotizaciones?: CotizacionEntity;
  cotizacion?: CotizacionEntity;   // Alias
  desglose_fifo?: DespachoLoteDetalleEntity[];
  despacho_lotes_detalles?: DespachoLoteDetalleEntity[];  // Alias
}

// ----------------------------------------------------------------------------
// 8. MÓDULO DE FACTURACIÓN Y BANCOS
// ----------------------------------------------------------------------------

export interface CuentaBancariaEntity {
  id_cuenta: string;
  banco: string;
  numero_cuenta: string;
  titular: string;
  activa: boolean;
}

export type TipoComprobante = 'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL';
export type CondicionPago = 'CONTADO' | 'CREDITO_15_DIAS' | 'CREDITO_30_DIAS';
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';

export interface FacturaEntity {
  id_factura: string;
  correlativo: string;
  id_orden?: string;
  tipo_comprobante: TipoComprobante;
  cliente_tipo: ClienteTipo;
  cliente_nombre: string;
  id_cliente?: string;
  condicion_pago: CondicionPago;
  metodo_pago?: MetodoPago;
  id_cuenta_bancaria?: string;
  numero_comprobante?: string;
  subtotal: number;
  impuesto_iva: number;
  total: number;
  fecha_emision: string;
  
  // Relaciones
  items_factura?: ItemFacturaEntity[];
  ordenes_despacho?: OrdenDespachoEntity;
}

export interface ItemFacturaEntity {
  id_item: string;
  id_factura: string;
  id_producto: string;
  id_lote?: string;
  cantidad: number;
  precio_aplicado: number;
  subtotal: number;
  
  // Relaciones
  productos?: ProductoEntity;
  lotes?: LoteEntity;
}

// Alias para compatibilidad con ComprobanteFiscal
export type ComprobanteFiscalEntity = FacturaEntity;