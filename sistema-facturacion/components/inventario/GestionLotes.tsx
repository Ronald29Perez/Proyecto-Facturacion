// ============================================================================
// COMPONENTE: GESTIÓN DE LOTES Y ENTRADAS A BODEGA (RESPONSIVE)
// Ubicación: components/inventario/GestionLotes.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import { ProductoEntity, LoteEntity } from '../../models/agrolactec';

interface Props {
  productos: ProductoEntity[];
  lotes: LoteEntity[];
  onGuardarLote: (nuevoLote: {
    id_producto: string;
    codigo_lote: string;
    fecha_vencimiento: string;
    cantidad_ingresada: number;
  }) => Promise<void>;
}

export function generarCodigoLoteAuto(itemCode: string = ''): string {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const codigoLimpio = itemCode.replace(/\D/g, '').slice(0, 3) || 'GEN';
  const secuencial = Math.floor(100 + Math.random() * 900);
  return `LOT-${anio}${mes}-${codigoLimpio}-${secuencial}`;
}

function calcularEstadoVencimiento(fechaVencimiento: string): 'NORMAL' | 'POR_VENCER' | 'VENCIDO' {
  const hoy = new Date();
  const vence = new Date(fechaVencimiento);
  const dias = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (dias < 0) return 'VENCIDO';
  if (dias <= 7) return 'POR_VENCER';
  return 'NORMAL';
}

export default function GestionLotes({ productos, lotes, onGuardarLote }: Props) {
  const [idProducto, setIdProducto] = useState('');
  const [codigoLote, setCodigoLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [cajasFisicas, setCajasFisicas] = useState<number>(1);
  const [guardando, setGuardando] = useState(false);

  const productoSeleccionado = productos.find((p) => p.id_producto === idProducto);

  const handleSeleccionarProducto = (id: string) => {
    setIdProducto(id);
    const prod = productos.find((p) => p.id_producto === id);
    if (prod) {
      setCodigoLote(generarCodigoLoteAuto(prod.item_code));
    }
  };

  const handleGenerarLoteManual = () => {
    const itemCode = productoSeleccionado ? productoSeleccionado.item_code : '';
    setCodigoLote(generarCodigoLoteAuto(itemCode));
  };

  const esVentaPorCaja = productoSeleccionado?.unidad_medida === 'CAJA';
  const factorConversion = esVentaPorCaja ? 1 : (productoSeleccionado?.unidades_por_caja || 1);
  const unidadesCalculadas = cajasFisicas * factorConversion;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idProducto || !codigoLote || !fechaVencimiento || cajasFisicas <= 0) {
      alert('Por favor completa todos los campos del lote.');
      return;
    }

    setGuardando(true);
    
    await onGuardarLote({
      id_producto: idProducto,
      codigo_lote: codigoLote,
      fecha_vencimiento: fechaVencimiento,
      cantidad_ingresada: Number(cajasFisicas),
    });
    
    setGuardando(false);

    setIdProducto('');
    setCodigoLote('');
    setFechaVencimiento('');
    setCajasFisicas(1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      
      {/* COLUMNA IZQUIERDA: FORMULARIO (Ocupa 1/3 en PC) */}
      <div className="col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
        <h3 className="mt-0 text-slate-900 text-lg font-bold">
           Registrar Nuevo Lote
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          
          {/* Producto */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Producto *</label>
            <select
              value={idProducto}
              onChange={(e) => handleSeleccionarProducto(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:border-sky-500 text-sm"
            >
              <option value="">-- Seleccionar Producto --</option>
              {productos.map((prod) => (
                <option key={prod.id_producto} value={prod.id_producto}>
                  {prod.nombre} ({prod.item_code})
                </option>
              ))}
            </select>
          </div>

          {/* Código de lote */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Código de Lote *</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: LOTE-2026-001"
                value={codigoLote}
                onChange={(e) => setCodigoLote(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleGenerarLoteManual}
                className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-md font-bold text-xs whitespace-nowrap transition-colors"
              >
                 Generar
              </button>
            </div>
          </div>

          {/* Fecha vencimiento */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Fecha de Vencimiento *</label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Cantidad de Cajas Físicas */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Cajas Físicas Recibidas *</label>
            <input
              type="number"
              min="1"
              value={cajasFisicas}
              onChange={(e) => setCajasFisicas(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Resumen de conversión */}
          {productoSeleccionado && (
            <div className={`p-3 rounded-md border text-xs leading-relaxed ${
              esVentaPorCaja ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              {esVentaPorCaja ? (
                <>
                   Este producto se vende por <strong>Caja</strong>. Se registrarán <strong>{cajasFisicas} cajas</strong> en el inventario.
                </>
              ) : (
                <>
                   <strong>Conversión:</strong> {cajasFisicas} cajas × {factorConversion} {productoSeleccionado.unidad_medida.toLowerCase()}(s)/caja = <strong>{unidadesCalculadas} unidades</strong> en inventario.
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className={`w-full py-3 mt-2 rounded-md font-bold text-white transition-colors ${
              guardando ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {guardando ? 'Ingresando Lote...' : ' Registrar Entrada a Bodega'}
          </button>
        </form>
      </div>

      {/* COLUMNA DERECHA: TABLA DE LOTES (Ocupa 2/3 en PC) */}
      <div className="col-span-1 lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="mt-0 text-slate-900 text-lg font-bold mb-4">
           Lotes en Bodega (FIFO)
        </h3>

        {lotes.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay lotes registrados en el inventario de bodega.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3">Lote</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Vencimiento</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote) => {
                  const estado = lote.estado_vencimiento || calcularEstadoVencimiento(lote.fecha_vencimiento);

                  const colorEstado =
                    estado === 'VENCIDO' ? 'bg-red-100 text-red-700'
                    : estado === 'POR_VENCER' ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700';

                  return (
                    <tr key={lote.id_lote} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-bold text-sky-600">{lote.codigo_lote}</td>
                      <td className="p-3 text-slate-800">{lote.productos?.nombre || 'Producto sin nombre'}</td>
                      <td className="p-3 text-slate-600">{lote.fecha_vencimiento}</td>
                      <td className="p-3 text-green-600 font-bold">
                        {lote.cantidad_disponible}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          {lote.productos?.unidad_medida?.toLowerCase() || 'unidad'}(s)
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colorEstado}`}>
                          {estado === 'VENCIDO' ? '🔴 Vencido' : estado === 'POR_VENCER' ? '🟡 Por vencer' : '🟢 Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}