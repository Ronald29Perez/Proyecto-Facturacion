// ============================================================================
// COMPONENTE: GESTIÓN DE CATÁLOGO Y FICHA DE PRODUCTOS (TABLA + MODAL)
// Ubicación: components/inventario/RegistroProducto.tsx
// BD: v3.0 — usa ProductoEntity, CategoriaEntity, SubcategoriaEntity, ProveedorEntity
// ============================================================================

'use client';

import React, { useState } from 'react';
import {
  ProductoEntity,
  CategoriaEntity,
  SubcategoriaEntity,
  ProveedorEntity,
} from '../../models/agrolactec';
import ImportExportProductos from './ImportExportProductos';
import {
  guardarOActualizarProducto,
  cambiarEstadoProducto,
} from '../../controllers/productoController';

interface Props {
  productos: ProductoEntity[];
  categorias: CategoriaEntity[];
  subcategorias: SubcategoriaEntity[];
  proveedores: ProveedorEntity[];
  onRefrescarDatos: () => Promise<void>;
}

export default function RegistroProducto({
  productos,
  categorias,
  subcategorias,
  proveedores,
  onRefrescarDatos,
}: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Partial<ProductoEntity> | null>(null);
  const [guardando, setGuardando] = useState(false);

  // ==========================================================================
  // ABRIR MODAL
  // ==========================================================================
  const handleAbrirModal = (prod?: ProductoEntity) => {
    if (prod) {
      setProductoEditar({ ...prod });
    } else {
      setProductoEditar({
        item_code: '',
        nombre: '',
        id_categoria: categorias[0]?.id_categoria || '',
        id_subcategoria: undefined,
        id_proveedor: proveedores[0]?.id_proveedor || undefined,
        nso: '',
        descripcion: '',
        unidad_medida: 'CAJA',
        unidades_por_caja: 12,
        precio_b2c: 0,
        precio_b2b: 0,
        activo: true,
      });
    }
    setMostrarModal(true);
  };

  // ==========================================================================
  // GUARDAR
  // ==========================================================================
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productoEditar?.item_code || !productoEditar?.nombre) {
      alert('Por favor completa el código y el nombre del producto.');
      return;
    }

    if (!productoEditar.id_categoria) {
      alert('Debes seleccionar una categoría.');
      return;
    }

    setGuardando(true);
    const res = await guardarOActualizarProducto(productoEditar);
    setGuardando(false);

    alert(res.message);
    if (res.success) {
      setMostrarModal(false);
      await onRefrescarDatos();
    }
  };

  // ==========================================================================
  // TOGGLE ESTADO
  // ==========================================================================
  const handleToggleEstado = async (id_producto: string, estadoActual: boolean) => {
    const accion = estadoActual ? 'descontinuar' : 'reactivar';
    if (confirm(`¿Estás seguro de que deseas ${accion} este producto?`)) {
      const res = await cambiarEstadoProducto(id_producto, !estadoActual);
      alert(res.message);
      if (res.success) {
        await onRefrescarDatos();
      }
    }
  };

  // ==========================================================================
  // FILTRADO
  // ==========================================================================
  const productosFiltrados = productos.filter((p) => {
    const term = busqueda.toLowerCase().trim();
    const nombre = (p.nombre || '').toLowerCase();
    const code = (p.item_code || '').toLowerCase();
    return nombre.includes(term) || code.includes(term);
  });

  // Subcategorías filtradas por la categoría seleccionada en el modal
  const subcatsFiltradas = subcategorias.filter(
    (s) => s.id_categoria === productoEditar?.id_categoria
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* 1. IMPORT/EXPORT CSV */}
      <ImportExportProductos onImportComplete={onRefrescarDatos} />

      {/* 2. ENCABEZADO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '20px 0',
          flexWrap: 'wrap',
          gap: '15px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>
            📝 Administración de Catálogo
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Gestiona precios, modifica fichas técnicas o cambia el estado de productos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleAbrirModal()}
          style={{
            backgroundColor: '#16a34a',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ➕ Nuevo Producto
        </button>
      </div>

      {/* 3. BUSCADOR */}
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar producto por código o nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.9rem',
          }}
        />
      </div>

      {/* 4. TABLA */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.88rem',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                color: '#475569',
              }}
            >
              <th style={{ padding: '12px' }}>Código</th>
              <th style={{ padding: '12px' }}>Producto</th>
              <th style={{ padding: '12px' }}>Categoría</th>
              <th style={{ padding: '12px' }}>Precio B2C</th>
              <th style={{ padding: '12px' }}>Precio B2B</th>
              <th style={{ padding: '12px' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}
                >
                  No se encontraron productos registrados.
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => {
                const esActivo = p.activo !== false;
                return (
                  <tr
                    key={p.id_producto}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      opacity: esActivo ? 1 : 0.55,
                      backgroundColor: esActivo ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#0284c7' }}>
                      {p.item_code}
                    </td>
                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: '500' }}>
                      {p.nombre}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {p.categorias?.nombre || '—'}
                      {p.subcategorias?.nombre && (
                        <>
                          <br />
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {p.subcategorias.nombre}
                          </span>
                        </>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#16a34a' }}>
                      ${Number(p.precio_b2c || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#0284c7' }}>
                      ${Number(p.precio_b2b || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor: esActivo ? '#dcfce7' : '#fee2e2',
                          color: esActivo ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {esActivo ? '🟢 Activo' : '🔴 Descontinuado'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleAbrirModal(p)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                          }}
                        >
                          ✏️ Modificar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            p.id_producto && handleToggleEstado(p.id_producto, esActivo)
                          }
                          disabled={!p.id_producto}
                          style={{
                            backgroundColor: esActivo ? '#ef4444' : '#22c55e',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {esActivo ? '🚫 Descontinuar' : '🔄 Reactivar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. MODAL */}
      {mostrarModal && productoEditar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>
              {productoEditar.id_producto
                ? '✏️ Modificar Producto'
                : '➕ Registrar Nuevo Producto'}
            </h3>

            <form
              onSubmit={handleGuardar}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}
            >
              {/* Código */}
              <div>
                <label style={labelStyle}>Código Ítem *</label>
                <input
                  type="text"
                  required
                  value={productoEditar.item_code || ''}
                  onChange={(e) =>
                    setProductoEditar({ ...productoEditar, item_code: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              {/* NSO */}
              <div>
                <label style={labelStyle}>NSO (Registro Sanitario)</label>
                <input
                  type="text"
                  value={productoEditar.nso || ''}
                  onChange={(e) =>
                    setProductoEditar({ ...productoEditar, nso: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              {/* Nombre */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={productoEditar.nombre || ''}
                  onChange={(e) =>
                    setProductoEditar({ ...productoEditar, nombre: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              {/* Categoría */}
              <div>
                <label style={labelStyle}>Categoría *</label>
                <select
                  value={productoEditar.id_categoria || ''}
                  onChange={(e) =>
                    setProductoEditar({
                      ...productoEditar,
                      id_categoria: e.target.value,
                      id_subcategoria: undefined, // reset al cambiar categoría
                    })
                  }
                  style={{ ...inputStyle, backgroundColor: '#fff' }}
                >
                  <option value="">-- Selecciona --</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategoría */}
              <div>
                <label style={labelStyle}>Subcategoría</label>
                <select
                  value={productoEditar.id_subcategoria || ''}
                  onChange={(e) =>
                    setProductoEditar({
                      ...productoEditar,
                      id_subcategoria: e.target.value || undefined,
                    })
                  }
                  style={{ ...inputStyle, backgroundColor: '#fff' }}
                  disabled={subcatsFiltradas.length === 0}
                >
                  <option value="">-- Ninguna --</option>
                  {subcatsFiltradas.map((s) => (
                    <option key={s.id_subcategoria} value={s.id_subcategoria}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Proveedor */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Proveedor</label>
                <select
                  value={productoEditar.id_proveedor || ''}
                  onChange={(e) =>
                    setProductoEditar({
                      ...productoEditar,
                      id_proveedor: e.target.value || undefined,
                    })
                  }
                  style={{ ...inputStyle, backgroundColor: '#fff' }}
                >
                  <option value="">-- Sin proveedor --</option>
                  {proveedores.map((p) => (
                    <option key={p.id_proveedor} value={p.id_proveedor}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unidad de medida */}
              <div>
                <label style={labelStyle}>Unidad de Medida</label>
                <select
                  value={productoEditar.unidad_medida || 'CAJA'}
                  onChange={(e) =>
                    setProductoEditar({
                      ...productoEditar,
                      unidad_medida: e.target.value as any,
                    })
                  }
                  style={{ ...inputStyle, backgroundColor: '#fff' }}
                >
                  <option value="CAJA">CAJA</option>
                  <option value="UNIDAD">UNIDAD</option>
                  <option value="LIBRA">LIBRA</option>
                  <option value="DOCENA">DOCENA</option>
                  <option value="PAQUETE">PAQUETE</option>
                </select>
              </div>

              {/* Unidades por caja */}
              <div>
                <label style={labelStyle}>Unidades por Caja</label>
                <input
                  type="number"
                  min={1}
                  value={productoEditar.unidades_por_caja || 1}
                  onChange={(e) =>
                    setProductoEditar({
                      ...productoEditar,
                      unidades_por_caja: Number(e.target.value),
                    })
                  }
                  style={inputStyle}
                />
              </div>

              {/* Precio B2C */}
              <div>
                <label style={labelStyle}>Precio B2C (Detalle)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productoEditar.precio_b2c || 0}
                  onChange={(e) =>
                    setProductoEditar({
                      ...productoEditar,
                      precio_b2c: Number(e.target.value),
                    })
                  }
                  style={inputStyle}
                />
              </div>

              {/* Precio B2B */}
              <div>
                <label style={labelStyle}>Precio B2B (Mayoreo / Caja)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productoEditar.precio_b2b || 0}
                  onChange={(e) =>
                    setProductoEditar({
                      ...productoEditar,
                      precio_b2b: Number(e.target.value),
                    })
                  }
                  style={inputStyle}
                />
              </div>

              {/* Descripción */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Descripción (opcional)</label>
                <textarea
                  rows={2}
                  value={productoEditar.descripcion || ''}
                  onChange={(e) =>
                    setProductoEditar({ ...productoEditar, descripcion: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>

              {/* Botones */}
              <div
                style={{
                  gridColumn: 'span 2',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '15px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  style={{
                    backgroundColor: '#64748b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: guardando ? 'not-allowed' : 'pointer',
                  }}
                >
                  {guardando ? 'Guardando...' : '💾 Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos compartidos
const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 'bold',
  color: '#475569',
  display: 'block',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
};