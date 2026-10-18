// ============================================================================
// CUSTOM HOOK: GESTIÓN DE CARRITO DE COMPRAS EN MEMORIA LOCAL
// Ubicación: hooks/useCarrito.ts
// ============================================================================

import { useState, useEffect } from 'react';
import { ItemCarrito, ProductoEstructurado, ResumenCarrito } from '../models/agrolactec';
import { crearCotizacionDesdeCarrito } from '../controllers/cotizacionController';

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  // 1. Cargar el carrito guardado en localStorage al montar el componente
  useEffect(() => {
    const carritoGuardado = localStorage.getItem('agrolactec_carrito');
    if (carritoGuardado) {
      try {
        setItems(JSON.parse(carritoGuardado));
      } catch (e) {
        console.error('Error al recuperar el carrito del almacenamiento local:', e);
      }
    }
  }, []);

  // 2. Sincronizar el estado del carrito con localStorage ante cada cambio
  useEffect(() => {
    localStorage.setItem('agrolactec_carrito', JSON.stringify(items));
  }, [items]);

  /**
   * Agrega o incrementa la cantidad de un producto en el carrito local
   */
  const agregarProducto = (
    producto: ProductoEstructurado,
    cantidad: number,
    unidadMedida: 'CAJA' | 'UNIDAD'
  ) => {
    setItems((prevItems) => {
      // Seleccionar precio según tipo de empaque (B2B por Caja o B2C por Unidad)
      const precioAplicado = unidadMedida === 'CAJA' ? producto.precio_b2b : producto.precio_b2c;
      
      const index = prevItems.findIndex(
        (it) => it.producto.id_producto === producto.id_producto && it.unidad_medida === unidadMedida
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

  /**
   * Elimina un ítem específico del carrito local
   */
  const eliminarProducto = (idProducto?: string, unidadMedida?: 'CAJA' | 'UNIDAD') => {
    if (!idProducto) return;
    setItems((prevItems) =>
      prevItems.filter(
        (it) => !(it.producto.id_producto === idProducto && it.unidad_medida === unidadMedida)
      )
    );
  };

  /**
   * Vacía por completo la memoria del carrito
   */
  const vaciarCarrito = () => {
    setItems([]);
    localStorage.removeItem('agrolactec_carrito');
  };

  // Cálculos financieros en memoria
  const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
  const impuestoIva = subtotal * 0.13; // 13% IVA El Salvador
  const total = subtotal + impuestoIva;

  const resumen: ResumenCarrito = {
    items,
    subtotal: parseFloat(subtotal.toFixed(2)),
    impuesto_iva: parseFloat(impuestoIva.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };

  /**
   * Envía el carrito acumulado a Supabase para convertirlo en una Cotización oficial
   */
  const procesarPedidoCotizacion = async (
    clienteNombre: string,
    clienteTipo: 'B2B_COMERCIO' | 'B2C_HOGAR',
    idClienteB2B?: string
  ) => {
    const resultado = await crearCotizacionDesdeCarrito(resumen, clienteNombre, clienteTipo, idClienteB2B);
    if (resultado.success) {
      vaciarCarrito(); // Limpiar la memoria local tras enviar con éxito
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