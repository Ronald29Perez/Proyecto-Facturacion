import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// 🔥 ESTA ES LA LÍNEA QUE FALTA O ESTÁ MAL:
export async function POST(request: Request) {
  try {
    const { email, nombreCliente, numeroPedido, total, productos } = await request.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlTicket = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0284c7; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">AgroLactec</h1>
          <p style="margin: 5px 0 0 0;">¡Gracias por tu compra!</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #0f172a;">Hola, ${nombreCliente}</h2>
          <p style="color: #475569;">Tu pedido <strong>#${numeroPedido}</strong> ha sido procesado y pagado exitosamente.</p>
          
          <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Detalle de tu pedido</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Cant.</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Producto</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${productos.map((p: any) => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${p.cantidad}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${p.nombre}</td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9;">$${Number(p.precio).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; background-color: #f8fafc; padding: 15px; border-radius: 6px;">
            <h3 style="margin: 0; color: #16a34a;">Total Pagado: $${Number(total).toFixed(2)}</h3>
          </div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 12px;">
          <p>Este es un correo automático generado por el sistema de AgroLactec ERP.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"AgroLactec" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Tu Ticket de Compra - Pedido #${numeroPedido}`,
      html: htmlTicket,
    });

    return NextResponse.json({ success: true, message: 'Correo enviado correctamente' });

  } catch (error: any) {
    console.error('Error enviando correo:', error);
    return NextResponse.json(
      { success: false, message: 'Error al enviar el correo', error: error.message },
      { status: 500 }
    );
  }
}