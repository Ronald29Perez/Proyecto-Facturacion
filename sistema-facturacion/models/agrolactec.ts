// ============================================================================
// CONTRATOS DE DATOS E INTERFACES TYPESCRIPT (ERP AGROLACTEC - REVISADO)
// Ubicación: models/agrolactec.ts
// ============================================================================

// ----------------------------------------------------------------------------
// 1. MÓDULO DE AUTENTICACIÓN Y ROLES
// ----------------------------------------------------------------------------

export interface Rol {
  id_rol: string;
  nombre_rol: string; // Ej: 'ADMINISTRADOR' | 'CAJERO' | 'GERENTE'
  descripcion?: string;
  creado_en?: string;
}

export interface Usuario {
  id_usuario: string;
  id_auth_supabase?: string;
  id_rol?: string;
  nombre_completo: string;
  username: string;
  email?: string;
  activo: boolean;
  creado_en?: string;
  rol?: Rol;
}

// ----------------------------------------------------------------------------
// 2. MÓDULO DE CATÁLOGO, CATEGORÍAS Y PROVEEDORES
// ----------------------------------------------------------------------------

export interface Categoria {
  id_categoria: string;
  nombre_categoria: string;
  descripcion?: string;
  activo?: boolean;
  creado_en?: string;
}

export interface Proveedor {
  id_proveedor: string;
  nombre_proveedor: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
  activo?: boolean;
  creado_en?: string;
}

export interface ProductoEstructurado {
  id_producto?: string;
  item_code: string;                  // Ej: '201-1'
  upc?: string;                        // Código de Barras UPC (Ej: '741908700201')
  nombre_producto: string;             // Nombre técnico (Ej: 'Queso Duro en Trozos 10 oz.')
  id_categoria: string;
  id_proveedor: string;
  subcategoria_agrupacion?: string;    // Ej: 'Quesos Duros de 10 oz.'
  marca?: string;                      // Ej: 'La Rivera'
  presentacion_empaque?: string;       // Ej: 'Case x 12 Und.'
  unidades_por_caja: number;           // Factor de conversión (Ej: 12)
  precio_detalle: number;              // Precio al detalle (B2C por Unidad)
  precio_mayoreo: number;              // Precio al mayoreo (B2B por Caja)
  nso?: string;                        // Registro Sanitario
  imagen_url?: string;                 // URL para catálogo visual
  activo?: boolean;
  creado_en?: string;

  // Propiedades opcionales para compatibilidad con otras vistas
  nombre?: string;
  codigo_barras?: string;
  subcategoria?: string;
  precio_b2c?: number;
  precio_b2b?: number;

  // Propiedades relacionales (Cargadas con JOIN desde Supabase)
  nombre_categoria?: string;
  nombre_proveedor?: string;
  categoria?: Categoria;
  proveedor?: Proveedor;
}

// Alias para mantener compatibilidad
export type ProductoCatalogo = ProductoEstructurado;

// ----------------------------------------------------------------------------
// 3. MÓDULO DE BODEGA Y CONTROL DE LOTES (FIFO)
// ----------------------------------------------------------------------------

export interface LoteEntity {
  id_lote: string;
  id_producto: string;
  codigo_lote: string;
  fecha_ingreso?: string;
  fecha_vencimiento: string;
  cajas_ingresadas: number;
  cajas_disponibles: number;
  unidades_disponibles: number;
  estado_vencimiento?: 'NORMAL' | 'POR_VENCER' | 'VENCIDO';
  creado_en?: string;

  // Relaciones
  producto?: ProductoEstructurado;
}

// ----------------------------------------------------------------------------
// 4. MÓDULO DE CARRITO Y COTIZACIONES (MEMORIA LOCAL)
// ----------------------------------------------------------------------------

export interface ItemCarrito {
  producto: ProductoEstructurado;
  unidad_medida: 'CAJA' | 'UNIDAD';
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface ResumenCarrito {
  items: ItemCarrito[];
  subtotal: number;
  impuesto_iva: number; // 13% IVA
  total: number;
}

export interface CotizacionDetalleEntity {
  id_detalle?: string;
  id_cotizacion?: string;
  id_producto: string;
  nombre_producto: string;
  unidad_medida: 'CAJA' | 'UNIDAD';
  cantidad: number;
  precio_unitario: number;
  subtotal_item: number;
}

export interface CotizacionEntity {
  id_cotizacion: string;
  numero_cotizacion: string;
  fecha_emision: string;
  cliente_tipo: 'B2B_COMERCIO' | 'B2C_HOGAR';
  cliente_nombre: string;
  id_cliente_b2b?: string;
  subtotal: number;
  impuesto_iva: number;
  total: number;
  estado: 'PENDIENTE' | 'APROBADA' | 'DESPACHADA' | 'RECHAZADA';
  creado_en?: string;

  // Relaciones
  detalles?: CotizacionDetalleEntity[];
}

// ----------------------------------------------------------------------------
// 5. MÓDULO DE ÓRDENES DE DESPACHO
// ----------------------------------------------------------------------------

export interface DespachoLoteDetalleEntity {
  id_despacho_lote?: string;
  id_orden?: string;
  id_lote: string;
  cajas_descontadas: number;
  unidades_descontadas: number;
  lote?: LoteEntity;
}

export interface OrdenDespachoEntity {
  id_orden: string;
  numero_orden: string;
  id_cotizacion: string;
  cliente_nombre: string;
  fecha_despacho: string;
  total_despachado: number;
  estado_pago: 'PENDIENTE' | 'PAGADO';
  id_usuario_bodega?: string;

  // Relaciones
  cotizacion?: CotizacionEntity;
  desglose_fifo?: DespachoLoteDetalleEntity[];
}

// ----------------------------------------------------------------------------
// 6. MÓDULO DE FACTURACIÓN, BANCOS Y PAGOS
// ----------------------------------------------------------------------------

export interface CuentaBancaria {
  id_cuenta: string;
  banco: string;
  numero_cuenta: string;
  tipo_cuenta: 'CORRIENTE' | 'AHORROS';
  titular: string;
  activa: boolean;
}

export interface ComprobanteFiscalEntity {
  id_comprobante?: string;
  numero_documento: string;
  tipo_documento: 'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL_CCF';
  id_orden: string;
  cliente_nombre: string;
  nit_nrc_cliente?: string;
  subtotal_neto: number;
  iva_13: number;
  monto_total: number;
  metodo_pago: 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE' | 'WOMPI_SANDBOX';
  id_cuenta_destino?: string;
  numero_comprobante_banco?: string;
  fecha_emision?: string;

  // Relaciones
  cuenta_bancaria?: CuentaBancaria;
}