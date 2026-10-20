// ============================================================================
// COMPONENTE: MÓDULO DE FACTURACIÓN, PAGOS Y COMPROBANTES FISCALES
// Ubicación: components/facturacion/ComprobanteFiscal.tsx
// BD: v3.0 — usa FacturaEntity con 'tipo_comprobante' y 'condicion_pago'
// ============================================================================

'use client';

import React, { useState } from 'react';
import { OrdenDespachoEntity, CuentaBancariaEntity } from '../../models/agrolactec';

interface Props {
  ordenesPorFacturar: OrdenDespachoEntity[];
  cuentasBancarias: CuentaBancariaEntity[];
  onGenerarComprobante: (datos: {
    id_orden: string;
    tipo_comprobante: 'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL';
    condicion_pago: 'CONTADO' | 'CREDITO_15_DIAS' | 'CREDITO_30_DIAS';
    metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';
    id_cuenta_bancaria?: string;
    numero_comprobante?: string;
  }) => Promise<{ success: boolean; message: string; correlativo?: string }>;
}

export default function ComprobanteFiscal({
  ordenesPorFacturar,
  cuentasBancarias,
  onGenerarComprobante,
}: Props) {
  // ==========================================================================
  // ESTADOS
  // ==========================================================================
  const [ordenSel, setOrdenSel] = useState<OrdenDespachoEntity | null>(null);
  const [tipoComprobante, setTipoComprobante] = useState<
    'FACTURA_CONSUMIDOR_FINAL' | 'CREDITO_FISCAL'
  >('FACTURA_CONSUMIDOR_FINAL');
  const [condicionPago, setCondicionPago] = useState<
    'CONTADO' | 'CREDITO_15_DIAS' | 'CREDITO_30_DIAS'
  >('CONTADO');
  const [metodoPago, setMetodoPago] = useState<
    'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'
  >('TRANSFERENCIA');
  const [idCuentaSel, setIdCuentaSel] = useState('');
  const [numComprobanteBanco, setNumComprobanteBanco] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [documentoEmitido, setDocumentoEmitido] = useState<any | null>(null);

  // ==========================================================================
  // CÁLCULOS (13% IVA El Salvador)
  // ==========================================================================
  // En la BD v3.0 el total viene de la cotización, así que viene CON IVA.
  // Para desglosar: total / 1.13 = subtotal. El resto es IVA.
  const montoTotal = ordenSel?.cotizaciones?.total ?? ordenSel?.total_despachado ?? 0;
  const subtotalNeto = parseFloat((montoTotal / 1.13).toFixed(2));
  const iva13 = parseFloat((montoTotal - subtotalNeto).toFixed(2));

  // ==========================================================================
  // SUBMIT
  // ==========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordenSel) return alert('Selecciona una orden para facturar.');

    if (metodoPago === 'TRANSFERENCIA' && (!idCuentaSel || !numComprobanteBanco.trim())) {
      return alert('Selecciona la cuenta bancaria de destino e ingresa el número de comprobante.');
    }

    setGuardando(true);

    const resp = await onGenerarComprobante({
      id_orden: ordenSel.id_orden,
      tipo_comprobante: tipoComprobante,
      condicion_pago: condicionPago,
      metodo_pago: metodoPago,
      id_cuenta_bancaria: idCuentaSel || undefined,
      numero_comprobante: numComprobanteBanco || undefined,
    });

    setGuardando(false);

    if (resp.success) {
      alert(`✅ Comprobante ${resp.correlativo} generado con éxito.`);
      setDocumentoEmitido({
        numero: resp.correlativo,
        cliente: ordenSel.cotizaciones?.cliente_nombre || 'Cliente',
        tipo: tipoComprobante,
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '20px',
        padding: '10px',
      }}
    >
      {/* ==================================================================== */}
      {/* FORMULARIO DE FACTURACIÓN */}
      {/* ==================================================================== */}
      <div
        style={{
          border: '1px solid #cbd5e1',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
        }}
      >
        <h3>🧾 Emisión de Comprobante Fiscal</h3>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '15px',
          }}
        >
          {/* Orden */}
          <div>
            <label style={labelStyle}>Orden Despachada a Facturar:</label>
            <select
              onChange={(e) => {
                const encontrada = ordenesPorFacturar.find(
                  (o) => o.id_orden === e.target.value
                );
                setOrdenSel(encontrada || null);
              }}
              value={ordenSel?.id_orden || ''}
              style={inputStyle}
            >
              <option value="">-- Seleccionar Orden --</option>
              {ordenesPorFacturar.map((ord) => (
                <option key={ord.id_orden} value={ord.id_orden}>
                  {ord.numero_orden} — {ord.cotizaciones?.cliente_nombre || 'Cliente'} ($
                  {Number(ord.cotizaciones?.total ?? ord.total_despachado ?? 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de comprobante */}
          <div>
            <label style={labelStyle}>Tipo de Documento Fiscal:</label>
            <select
              value={tipoComprobante}
              onChange={(e) => setTipoComprobante(e.target.value as any)}
              style={inputStyle}
            >
              <option value="FACTURA_CONSUMIDOR_FINAL">Factura Consumidor Final</option>
              <option value="CREDITO_FISCAL">Comprobante de Crédito Fiscal (CCF)</option>
            </select>
          </div>

          {/* Condición de pago */}
          <div>
            <label style={labelStyle}>Condición de Pago:</label>
            <select
              value={condicionPago}
              onChange={(e) => setCondicionPago(e.target.value as any)}
              style={inputStyle}
            >
              <option value="CONTADO">Contado</option>
              <option value="CREDITO_15_DIAS">Crédito 15 días</option>
              <option value="CREDITO_30_DIAS">Crédito 30 días</option>
            </select>
          </div>

          {/* Método de pago */}
          <div>
            <label style={labelStyle}>Método de Pago:</label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as any)}
              style={inputStyle}
            >
              <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              <option value="EFECTIVO">Efectivo / Caja Chica</option>
              <option value="TARJETA">Tarjeta / Pasarela</option>
            </select>
          </div>

          {/* Detalles de transferencia */}
          {metodoPago === 'TRANSFERENCIA' && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
              }}
            >
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                Cuenta Bancaria AgroLactec Receptora:
              </label>
              <select
                value={idCuentaSel}
                onChange={(e) => setIdCuentaSel(e.target.value)}
                style={{ ...inputStyle, marginTop: '4px', marginBottom: '8px' }}
              >
                <option value="">-- Seleccionar Banco --</option>
                {cuentasBancarias.map((cta) => (
                  <option key={cta.id_cuenta} value={cta.id_cuenta}>
                    {cta.banco}: {cta.numero_cuenta} ({cta.titular})
                  </option>
                ))}
              </select>

              <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                N° de Comprobante / Referencia Bancaria:
              </label>
              <input
                type="text"
                placeholder="Ej: TRANS-987654"
                value={numComprobanteBanco}
                onChange={(e) => setNumComprobanteBanco(e.target.value)}
                style={{ ...inputStyle, marginTop: '4px' }}
              />
            </div>
          )}

          {/* Desglose monetario */}
          {ordenSel && (
            <div
              style={{
                backgroundColor: '#ecfdf5',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #10b981',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Monto Neto Sin IVA:</span>
                <span>${subtotalNeto.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA (13%):</span>
                <span>${iva13.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  color: '#047857',
                  marginTop: '4px',
                }}
              >
                <span>Total a Cobrar:</span>
                <span>${montoTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={guardando || !ordenSel}
            style={{
              padding: '12px',
              backgroundColor: guardando || !ordenSel ? '#94a3b8' : '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: guardando || !ordenSel ? 'not-allowed' : 'pointer',
              marginTop: '10px',
            }}
          >
            {guardando
              ? 'Generando Comprobante...'
              : '💳 Registrar Pago y Emitir Comprobante'}
          </button>
        </form>
      </div>

      {/* ==================================================================== */}
      {/* VISTA PREVIA */}
      {/* ==================================================================== */}
      <div
        style={{
          border: '1px solid #cbd5e1',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
        }}
      >
        <h3>📄 Vista Previa de Documento Emitido</h3>

        {documentoEmitido ? (
          <div
            style={{
              border: '2px dashed #94a3b8',
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              marginTop: '15px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '10px',
                marginBottom: '10px',
              }}
            >
              <h2 style={{ margin: 0, color: '#1e3a8a' }}>AGROLACTEC S.A. DE C.V.</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Distribuidora de Lácteos y Embutidos de El Salvador
              </p>
              <h3 style={{ margin: '8px 0 0 0', color: '#16a34a' }}>
                {documentoEmitido.tipo.replace(/_/g, ' ')}
              </h3>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                N°: {documentoEmitido.numero}
              </span>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '15px' }}>
              <div>
                Cliente: <strong>{documentoEmitido.cliente}</strong>
              </div>
              <div>Fecha: {new Date().toLocaleDateString()}</div>
            </div>

            <div
              style={{
                borderTop: '1px solid #cbd5e1',
                paddingTop: '10px',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal Neto:</span>
                <span>${documentoEmitido.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>13% IVA:</span>
                <span>${documentoEmitido.iva.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  marginTop: '8px',
                }}
              >
                <span>TOTAL:</span>
                <span>${documentoEmitido.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '20px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🖨️ Imprimir / Guardar en PDF
            </button>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Aún no se ha generado ningún comprobante en esta sesión. Selecciona una
            orden a la izquierda para proceder con el cobro y emisión.
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos compartidos
const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 'bold',
  display: 'block',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  marginTop: '4px',
};