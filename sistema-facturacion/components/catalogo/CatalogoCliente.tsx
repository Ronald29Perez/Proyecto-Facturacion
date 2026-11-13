// ============================================================================
// COMPONENTE: VISTA DE CATÁLOGO Y CARRITO DE CLIENTE
// Ubicación: components/catalogo/CatalogoCliente.tsx
// BD: v3.1 — Iconos profesionales y fotos de productos
// ============================================================================

'use client';

import React, { useState } from 'react';
import { ProductoEntity, CategoriaEntity } from '../../models/agrolactec';
import { ShoppingBag, Search, PackageX } from 'lucide-react';

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
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', marginBottom: '20px' }}>
        <ShoppingBag size={24} color="#0284c7" />
        Catálogo de Productos
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
        <div style={{ flex: 1, position: 'relative', minWidth: '220px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o código de ítem..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 35px', // Espacio extra a la izquierda para el icono
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
            }}
          />
        </div>

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
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <PackageX size={48} color="#cbd5e1" />
          <p style={{ fontSize: '1.1rem', margin: 0 }}>
            No se encontraron productos en el catálogo.
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
                {/* 🔥 FOTO DEL PRODUCTO */}
                <div style={{ height: '140px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {prod.imagen_url ? (
                    <img src={prod.imagen_url} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ShoppingBag size={32} color="#cbd5e1" /> // Icono por defecto si no hay foto
                  )}
                </div>

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

                <h3 style={{ margin: '8px 0 4px 0', fontSize: '1.05rem', color: '#0f172a' }}>
                  {prod.nombre || 'Producto sin nombre'}
                </h3>

                <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#64748b' }}>
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
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                    Precio Detalle:
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>
                    ${Number(prod.precio_b2c || 0).toFixed(2)}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
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