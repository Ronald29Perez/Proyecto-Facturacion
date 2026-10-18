// ============================================================================
// COMPONENTE: MÓDULO DE FACTURACIÓN, PAGOS Y COMPROBANTES FISCALES (EL SALVADOR)
// Ubicación: components/facturacion/ComprobanteFiscal.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import { OrdenDespachoEntity } from '../../models/agrolactec';

interface CuentaBancaria {
  id_cuenta: string;
  banco: string;
  numero_cuenta: string;
  tipo_cuenta: string;
  titular: string;
}

interface Props {
  ordenesPorFacturar: OrdenDespachoEntity[];
  cuentasBancarias: CuentaBancaria[];
  onGenerarComprobante: (datosComprobante: {
    id_orden: string;
    tipo_documento: 'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL_CCF';
    cliente_nombre: string;
    nit_nrc_cliente?: string;
    subtotal_neto: number;
    iva_13: number;
    monto_total: number;
    metodo_pago: 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE' | 'WOMPI_SANDBOX';
    id_cuenta_destino?: string;
    numero_comprobante_banco?: string;
  }) => Promise<{ success: boolean; message: string; numero_documento?: string }>;
}

export default function ComprobanteFiscal({
  ordenesPorFacturar,
  cuentasBancarias,
  onGenerarComprobante,
}: Props) {
  // Estados del formulario de facturación
  const [ordenSel, setOrdenSel] = useState<OrdenDespachoEntity | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL_CCF'>('FACTURA_CONSUMIDOR_FINAL');
  const [nitNrc, setNitNrc] = useState('');
  const [metodoPago, setMetodoPago] = useState<'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE' | 'WOMPI_SANDBOX'>('TRANSFERENCIA');
  const [idCuentaSel, setIdCuentaSel] = useState('');
  const [numComprobanteBanco, setNumComprobanteBanco] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [documentoEmitido, setDocumentoEmitido] = useState<any | null>(null);

  // Cálculos tributarios (13% IVA en El Salvador)
  const montoTotal = ordenSel ? ordenSel.total_despachado : 0;
  const subtotalNeto = parseFloat((montoTotal / 1.13).toFixed(2));
  const iva13 = parseFloat((montoTotal - subtotalNeto).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenSel) return alert('Selecciona una orden para facturar.');
    if (tipoDocumento === 'CREDITO_FISCAL_CCF' && !nitNrc.trim()) {
      return alert('El número de NIT/NRC es obligatorio para Crédito Fiscal (CCF).');
    }
    if (metodoPago === 'TRANSFERENCIA' && (!idCuentaSel || !numComprobanteBanco.trim())) {
      return alert('Selecciona la cuenta bancaria de destino e ingresa el número de comprobante.');
    }

    setGuardando(true);
    const resp = await onGenerarComprobante({
      id_orden: ordenSel.id_orden,
      tipo_documento: tipoDocumento,
      cliente_nombre: ordenSel.cliente_nombre,
      nit_nrc_cliente: nitNrc,
      subtotal_neto: subtotalNeto,
      iva_13: iva13,
      monto_total: montoTotal,
      metodo_pago: metodoPago,
      id_cuenta_destino: idCuentaSel || undefined,
      numero_comprobante_banco: numComprobanteBanco || undefined,
    });
    setGuardando(false);

    if (resp.success) {
      alert(`✅ Comprobante ${resp.numero_documento} generado con éxito.`);
      setDocumentoEmitido({
        numero: resp.numero_documento,
        cliente: ordenSel.cliente_nombre,
        tipo: tipoDocumento,
        total: montoTotal,
        subtotal: subtotalNeto,
        iva: iva13,
      });
      setOrdenSel(null);
    } else {
      alert(`Error al facturar: ${resp.message}`);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', padding: '10px' }}>
      {/* SECCIÓN FORMULARIO DE FACTURACIÓN Y PAGO */}
      <div style={{ border: '1px solid #cbd5e1', padding: '20px', borderRadius: '8px', backgroundColor: '#ffffff' }}>
        <h3>🧾 Emisión de Comprobante Fiscal</h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Orden Despachada a Facturar:</label>
            <select
              onChange={(e) => {
                const encontrada = ordenesPorFacturar.find((o) => o.id_orden === e.target.value);
                setOrdenSel(encontrada || null);
              }}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
            >
              <option value="">-- Seleccionar Orden --</option>
              {ordenesPorFacturar.map((ord) => (
                <option key={ord.id_orden} value={ord.id_orden}>
                  {ord.numero_orden} - {ord.cliente_nombre} (${ord.total_despachado.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Tipo de Documento Fiscal:</label>
            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as any)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
            >
              <option value="FACTURA_CONSUMIDOR_FINAL">Factura Consumidor Final</option>
              <option value="CREDITO_FISCAL_CCF">Comprobante de Crédito Fiscal (CCF)</option>
            </select>
          </div>

          {tipoDocumento === 'CREDITO_FISCAL_CCF' && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>NIT / NRC del Cliente:</label>
              <input
                type="text"
                placeholder="Ej: 0614-150890-101-2 / NRC: 12345-6"
                value={nitNrc}
                onChange={(e) => setNitNrc(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Forma de Pago:</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as any)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
            >
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="EFECTIVO">Efectivo / Caja Chiquita</option>
              <option value="WOMPI_SANDBOX">Pasarela Wompi (Tarjeta/Digital)</option>
              <option value="CHEQUE">Cheque Bancario</option>
            </select>
          </div>

          {metodoPago === 'TRANSFERENCIA' && (
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Cuenta Bancaria AgroLactec Receptora:</label>
              <select
                value={idCuentaSel}
                onChange={(e) => setIdCuentaSel(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px', marginBottom: '8px' }}
              >
                <option value="">-- Seleccionar Banco --</option>
                {cuentasBancarias.map((cta) => (
                  <option key={cta.id_cuenta} value={cta.id_cuenta}>
                    {cta.banco} ({cta.tipo_cuenta}): {cta.numero_cuenta}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>N° de Comprobante / Referencia Bancaria:</label>
              <input
                type="text"
                placeholder="Ej: TRANS-987654"
                value={numComprobanteBanco}
                onChange={(e) => setNumComprobanteBanco(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </div>
          )}

          {/* DESGLOSE MONETARIO */}
          {ordenSel && (
            <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '6px', border: '1px solid #10b981', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Monto Neto Sin IVA:</span>
                <span>${subtotalNeto.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA (13%):</span>
                <span>${iva13.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#047857', marginTop: '4px' }}>
                <span>Total a Cobrar:</span>
                <span>${montoTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={guardando || !ordenSel}
            style={{ padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
          >
            {guardando ? 'Generando Comprobante...' : '💳 Registrar Pago y Emitir Comprobante'}
          </button>
        </form>
      </div>

      {/* VISTA PREVIA O IMPRESIÓN DEL COMPROBANTE GENERADO */}
      <div style={{ border: '1px solid #cbd5e1', padding: '20px', borderRadius: '8px', backgroundColor: '#ffffff' }}>
        <h3>📄 Vista Previa de Documento Emitido</h3>

        {documentoEmitido ? (
          <div style={{ border: '2px dashed #94a3b8', padding: '20px', borderRadius: '8px', backgroundColor: '#f8fafc', marginTop: '15px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1',  padding: '10px', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, color: '#1e3a8a' }}>AGROLACTEC S.A. DE C.V.</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Distribuidora de Lácteos y Embutidos de El Salvador</p>
              <h3 style={{ margin: '8px 0 0 0', color: '#16a34a' }}>{documentoEmitido.tipo.replace('_', ' ')}</h3>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>N°: {documentoEmitido.numero}</span>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '15px' }}>
              <div>Cliente: <strong>{documentoEmitido.cliente}</strong></div>
              <div>Fecha: {new Date().toLocaleDateString()}</div>
            </div>

            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal Neto:</span>
                <span>${documentoEmitido.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>13% IVA:</span>
                <span>${documentoEmitido.iva.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '8px' }}>
                <span>TOTAL COMPLETADO:</span>
                <span>${documentoEmitido.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              style={{ width: '100%', padding: '10px', marginTop: '20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              🖨️ Imprimir / Guardar en PDF
            </button>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Aún no se ha generado ningún comprobante en esta sesión. Selecciona una orden a la izquierda para proceder con el cobro y emisión.
          </div>
        )}
      </div>
    </div>
  );
}