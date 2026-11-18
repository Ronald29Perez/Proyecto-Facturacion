// ============================================================================
// COMPONENTE: GESTIÓN DE CATÁLOGO Y FICHA DE PRODUCTOS
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
import { subirImagenProducto } from '../../controllers/storageController';

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

  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string>('');

  const handleAbrirModal = (prod?: ProductoEntity) => {
    if (prod) {
      setProductoEditar({ ...prod });
      setPreviewImagen(prod.imagen_url || '');
    } else {
      setProductoEditar({
        item_code: '',
        nombre: '',
        id_categoria: categorias[0]?.id_categoria || '',
        id_subcategoria: undefined,
        id_proveedor: proveedores[0]?.id_proveedor || undefined,
        nso: '',
        descripcion: '',
        unidad_medida: 'UNIDAD',
        unidades_por_caja: 12,
        precio_b2c: 0,
        precio_b2b: 0,
        imagen_url: '',
        activo: true,
      });
      setPreviewImagen('');
    }
    setArchivoImagen(null);
    setMostrarModal(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoEditar?.item_code || !productoEditar?.nombre) return alert('Por favor completa el código y el nombre del producto.');
    if (!productoEditar.id_categoria) return alert('Debes seleccionar una categoría.');

    setGuardando(true);
    let urlFinal = productoEditar.imagen_url;

    if (archivoImagen) {
      const urlSubida = await subirImagenProducto(archivoImagen, productoEditar.item_code);
      if (urlSubida) urlFinal = urlSubida;
      else alert(' La imagen no se pudo subir, pero el producto se guardará sin foto.');
    }

    const res = await guardarOActualizarProducto({ ...productoEditar, imagen_url: urlFinal });
    setGuardando(false);

    alert(res.message);
    if (res.success) {
      setMostrarModal(false);
      await onRefrescarDatos();
    }
  };

  const handleToggleEstado = async (id_producto: string, estadoActual: boolean) => {
    const accion = estadoActual ? 'descontinuar' : 'reactivar';
    if (confirm(`¿Estás seguro de que deseas ${accion} este producto?`)) {
      const res = await cambiarEstadoProducto(id_producto, !estadoActual);
      alert(res.message);
      if (res.success) await onRefrescarDatos();
    }
  };

  const productosFiltrados = productos.filter((p) => {
    const term = busqueda.toLowerCase().trim();
    const nombre = (p.nombre || '').toLowerCase();
    const code = (p.item_code || '').toLowerCase();
    return nombre.includes(term) || code.includes(term);
  });

  const subcatsFiltradas = subcategorias.filter((s) => s.id_categoria === productoEditar?.id_categoria);
  const esVentaPorCaja = productoEditar?.unidad_medida === 'CAJA';

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
      <ImportExportProductos onImportComplete={onRefrescarDatos} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 my-6">
        <div>
          <h3 className="m-0 text-slate-900 text-lg font-bold">Administración de Catálogo</h3>
          <p className="m-0 mt-1 text-sm text-slate-500">Gestiona precios, modifica fichas técnicas o cambia el estado.</p>
        </div>
        <button
          type="button"
          onClick={() => handleAbrirModal()}
          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-md flex justify-center items-center gap-2 transition-colors"
        >
          Nuevo Producto
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar producto por código o nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-2.5 rounded-md border border-slate-300 text-sm focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* TABLA RESPONSIVE CON SCROLL HORIZONTAL */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="p-3">Imagen</th>
              <th className="p-3">Código</th>
              <th className="p-3">Producto</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Precio B2C</th>
              <th className="p-3">Precio B2B</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-slate-400">No se encontraron productos registrados.</td>
              </tr>
            ) : (
              productosFiltrados.map((p) => {
                const esActivo = p.activo !== false;
                return (
                  <tr key={p.id_producto} className={`border-b border-slate-100 transition-opacity ${esActivo ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                    <td className="p-3">
                      <div className="w-10 h-10 rounded border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {p.imagen_url ? (
                          <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-sky-600">{p.item_code}</td>
                    <td className="p-3 text-slate-900 font-medium">{p.nombre}</td>
                    <td className="p-3 text-slate-500">
                      {p.categorias?.nombre || '—'}
                      {p.subcategorias?.nombre && <><br /><span className="text-xs text-slate-400">{p.subcategorias.nombre}</span></>}
                    </td>
                    <td className="p-3 font-bold text-green-600">${Number(p.precio_b2c || 0).toFixed(2)}</td>
                    <td className="p-3 font-bold text-sky-600">${Number(p.precio_b2b || 0).toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${esActivo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {esActivo ? '🟢 Activo' : '🔴 Inactivo'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleAbrirModal(p)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">✏️ Modificar</button>
                        <button onClick={() => p.id_producto && handleToggleEstado(p.id_producto, esActivo)} disabled={!p.id_producto} className={`px-3 py-1.5 rounded text-xs font-bold text-white transition-colors ${esActivo ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                          {esActivo ? ' Descontinuar' : ' Reactivar'}
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

      {/* MODAL RESPONSIVE */}
      {mostrarModal && productoEditar && (
        <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-5 md:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="mt-0 text-slate-900 text-xl font-bold border-b pb-3 mb-5">
              {productoEditar.id_producto ? ' Modificar Producto' : ' Registrar Nuevo Producto'}
            </h3>

            <form onSubmit={handleGuardar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Código Ítem *</label>
                <input type="text" required value={productoEditar.item_code || ''} onChange={(e) => setProductoEditar({ ...productoEditar, item_code: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">NSO (Registro Sanitario)</label>
                <input type="text" value={productoEditar.nso || ''} onChange={(e) => setProductoEditar({ ...productoEditar, nso: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-sky-500" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 block mb-1">Nombre del Producto *</label>
                <input type="text" required value={productoEditar.nombre || ''} onChange={(e) => setProductoEditar({ ...productoEditar, nombre: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-sky-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Categoría *</label>
                <select value={productoEditar.id_categoria || ''} onChange={(e) => setProductoEditar({ ...productoEditar, id_categoria: e.target.value, id_subcategoria: undefined })} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
                  <option value="">-- Selecciona --</option>
                  {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Subcategoría</label>
                <select value={productoEditar.id_subcategoria || ''} onChange={(e) => setProductoEditar({ ...productoEditar, id_subcategoria: e.target.value || undefined })} disabled={subcatsFiltradas.length === 0} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white disabled:bg-slate-100">
                  <option value="">-- Ninguna --</option>
                  {subcatsFiltradas.map((s) => <option key={s.id_subcategoria} value={s.id_subcategoria}>{s.nombre}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 block mb-1">Proveedor</label>
                <select value={productoEditar.id_proveedor || ''} onChange={(e) => setProductoEditar({ ...productoEditar, id_proveedor: e.target.value || undefined })} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white">
                  <option value="">-- Sin proveedor --</option>
                  {proveedores.map((p) => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Unidad de Venta (B2C) *</label>
                <select 
                  value={productoEditar.unidad_medida || 'UNIDAD'} 
                  onChange={(e) => {
                    const nuevaUnidad = e.target.value as any;
                    setProductoEditar({ ...productoEditar, unidad_medida: nuevaUnidad, unidades_por_caja: nuevaUnidad === 'CAJA' ? 1 : (productoEditar.unidades_por_caja || 12) });
                  }} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                >
                  <option value="UNIDAD">Unidad</option>
                  <option value="LIBRA">Libra</option>
                  <option value="PAQUETE">Paquete</option>
                  <option value="CAJA">Caja</option>
                </select>
              </div>
              
              {!esVentaPorCaja && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Unidades por Caja *</label>
                  <input type="number" min={1} value={productoEditar.unidades_por_caja || 1} onChange={(e) => setProductoEditar({ ...productoEditar, unidades_por_caja: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Precio B2C *</label>
                <input type="number" step="0.01" value={productoEditar.precio_b2c || 0} onChange={(e) => setProductoEditar({ ...productoEditar, precio_b2c: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Precio B2B (Caja) *</label>
                <input type="number" step="0.01" value={productoEditar.precio_b2b || 0} onChange={(e) => setProductoEditar({ ...productoEditar, precio_b2b: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 block mb-1">Foto del Producto</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-1">
                  <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-300 overflow-hidden shrink-0">
                    {previewImagen ? <img src={previewImagen} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-400">Sin foto</span>}
                  </div>
                  <div className="flex-1 w-full">
                    <input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setArchivoImagen(file); setPreviewImagen(URL.createObjectURL(file)); }
                      }} className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
                    <p className="text-[10px] text-slate-500 mt-1">Formatos aceptados: JPG, PNG o WEBP.</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-600 block mb-1">Descripción (opcional)</label>
                <textarea rows={2} value={productoEditar.descripcion || ''} onChange={(e) => setProductoEditar({ ...productoEditar, descripcion: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none" />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 mt-4 border-t pt-4">
                <button type="button" onClick={() => setMostrarModal(false)} className="w-full sm:w-auto px-6 py-2.5 bg-slate-500 hover:bg-slate-600 text-white rounded-md font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-md font-bold transition-colors">
                  {guardando ? 'Guardando...' : ' Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}