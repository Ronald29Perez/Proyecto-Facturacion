import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  allowedDevOrigins: ['192.168.1.14'], // <-- Agrega tu IP de red local
};



export default nextConfig;
