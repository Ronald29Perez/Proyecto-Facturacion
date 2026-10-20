// ============================================================================
// COMPONENTE: VISTA DE CATÁLOGO Y CARRITO DE CLIENTE
// Ubicación: components/catalogo/CatalogoCliente.tsx
// BD: v3.0 — usa ProductoEntity y CategoriaEntity
// ============================================================================

'use client';

import React, { useState } from 'react';
import { ProductoEntity, CategoriaEntity } from '../../models/agrolactec';

interface Props {
  productos: ProductoEntity[];
  categorias: CategoriaEntity[];
}

export default function CatalogoCliente({ productos, categorias }: Props) {
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaSel, setCategoriaSel] = useState<string>('');

  // --------------------------------------------------------------------------
  // FILTRADO DINÁMICO
  // --------------------------------------------------------------------------
  const productosFiltrados = productos.filter((p) => {
    const nombreProd = (p.nombre || '').toLowerCase();
    const itemCode = (p.item_code || '').toLowerCase();
    const textoBusqueda = busqueda.toLowerCase().trim();

    const coincideNombre =
      nombreProd.includes(textoBusqueda) || itemCode.includes(textoBusqueda);

    const coincideCategoria =
      categoriaSel === '' || p.id_categoria === categoriaSel;

    return coincideNombre && coincideCategoria;
  });

  return (
    <div>
      <h2 style={{ color: '#1e293b', marginBottom: '15px' }}>
        🛍️ Catálogo de Productos
      </h2>

      {/* CONTROLES DE FILTRADO */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o código de ítem..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            minWidth: '220px',
          }}
        />

        <select
          value={categoriaSel}
          onChange={(e) => setCategoriaSel(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
          }}
        >
          <option value="">Todas las Categorías</option>
          {categorias.map((cat) => (
            <option key={cat.id_categoria} value={cat.id_categoria}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* REJILLA DE TARJETAS */}
      {productosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <p style={{ fontSize: '1.1rem' }}>
            📦 No se encontraron productos en el catálogo.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '15px',
          }}
        >
          {productosFiltrados.map((prod) => (
            <div
              key={prod.id_producto}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: '#0284c7',
                    backgroundColor: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {prod.item_code}
                </span>

                <h3
                  style={{
                    margin: '8px 0 4px 0',
                    fontSize: '1.05rem',
                    color: '#0f172a',
                  }}
                >
                  {prod.nombre || 'Producto sin nombre'}
                </h3>

                {/* Categoría + Subcategoría */}
                <p
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '0.8rem',
                    color: '#64748b',
                  }}
                >
                  {prod.categorias?.nombre || 'Sin categoría'}
                  {prod.subcategorias?.nombre && (
                    <> · {prod.subcategorias.nombre}</>
                  )}
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '10px',
                  marginTop: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      display: 'block',
                    }}
                  >
                    Precio Detalle:
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>
                    ${Number(prod.precio_b2c || 0).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      display: 'block',
                    }}
                  >
                    Mayoreo (Caja):
                  </span>
                  <strong style={{ fontSize: '0.95rem', color: '#0284c7' }}>
                    ${Number(prod.precio_b2b || 0).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}