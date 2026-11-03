import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgroLactec ERP",
  description: "Sistema de Pedidos e Inventario",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 🔥 Agregamos un id="app-body" para identificarlo y quitamos las clases de impresión problemáticas */}
      <body id="app-body" className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}