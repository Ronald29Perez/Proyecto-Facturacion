// ============================================================================
// CUSTOM HOOK: GESTIÓN DE CARRITO DE COMPRAS EN MEMORIA LOCAL
// Ubicación: hooks/useCarrito.ts
// BD: v3.0 — usa ProductoEntity y parámetro idCliente
// ============================================================================

import { useState, useEffect } from 'react';
import {
  ItemCarrito,
  ProductoEntity,
  ResumenCarrito,
  UnidadMedida,
} from '../models/agrolactec';
import { crearCotizacionDesdeCarrito } from '../controllers/cotizacionController';

// Restringimos las unidades de venta para evitar que el carrito permita
// "LIBRA" o "DOCENA" si la UI solo ofrece cajas/unidades.
type UnidadVenta = Extract<UnidadMedida, 'CAJA' | 'UNIDAD'>;

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [cargado, setCargado] = useState(false);

  // 1. Cargar del localStorage al montar
  useEffect(() => {
    const carritoGuardado = localStorage.getItem('agrolactec_carrito');
    if (carritoGuardado) {
      try {
        setItems(JSON.parse(carritoGuardado));
      } catch (e) {
        console.error('Error al recuperar el carrito:', e);
      }
    }
    setCargado(true);
  }, []);

  // 2. Sincronizar con localStorage en cada cambio (solo tras cargar)
  useEffect(() => {
    if (!cargado) return;
    localStorage.setItem('agrolactec_carrito', JSON.stringify(items));
  }, [items, cargado]);

  // ==========================================================================
  // AGREGAR PRODUCTO
  // ==========================================================================
  const agregarProducto = (
    producto: ProductoEntity,
    cantidad: number,
    unidadMedida: UnidadVenta
  ) => {
    setItems((prevItems) => {
      // Precio según tipo de empaque (B2B por caja o B2C por unidad)
      const precioAplicado =
        unidadMedida === 'CAJA' ? producto.precio_b2b : producto.precio_b2c;

      const index = prevItems.findIndex(
        (it) =>
          it.producto.id_producto === producto.id_producto &&
          it.unidad_medida === unidadMedida
      );

      if (index >= 0) {
        const copia = [...prevItems];
        const nuevaCantidad = copia[index].cantidad + cantidad;
        copia[index] = {
          ...copia[index],
          cantidad: nuevaCantidad,
          subtotal: parseFloat((nuevaCantidad * precioAplicado).toFixed(2)),
        };
        return copia;
      }

      return [
        ...prevItems,
        {
          producto,
          unidad_medida: unidadMedida,
          cantidad,
          precio_unitario: precioAplicado,
          subtotal: parseFloat((cantidad * precioAplicado).toFixed(2)),
        },
      ];
    });
  };

  // ==========================================================================
  // ELIMINAR PRODUCTO
  // ==========================================================================
  const eliminarProducto = (idProducto?: string, unidadMedida?: UnidadVenta) => {
    if (!idProducto) return;
    setItems((prevItems) =>
      prevItems.filter(
        (it) =>
          !(
            it.producto.id_producto === idProducto &&
            it.unidad_medida === unidadMedida
          )
      )
    );
  };

  // ==========================================================================
  // VACIAR CARRITO
  // ==========================================================================
  const vaciarCarrito = () => {
    setItems([]);
    localStorage.removeItem('agrolactec_carrito');
  };

  // ==========================================================================
  // CÁLCULOS FINANCIEROS
  // ==========================================================================
  const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
  const impuestoIva = subtotal * 0.13;
  const total = subtotal + impuestoIva;

  const resumen: ResumenCarrito = {
    items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    impuesto_iva: parseFloat(impuestoIva.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };

  // ==========================================================================
  // PROCESAR COTIZACIÓN
  // ==========================================================================
  const procesarPedidoCotizacion = async (
    clienteNombre: string,
    clienteTipo: 'B2B_COMERCIO' | 'B2C_HOGAR',
    idCliente?: string  // 🔥 Cambiado: antes era idClienteB2B
  ) => {
    const resultado = await crearCotizacionDesdeCarrito(
      resumen,
      clienteNombre,
      clienteTipo,
      idCliente
    );

    if (resultado.success) {
      vaciarCarrito();
    }
    return resultado;
  };

  return {
    items,
    resumen,
    agregarProducto,
    eliminarProducto,
    vaciarCarrito,
    procesarPedidoCotizacion,
  };
}