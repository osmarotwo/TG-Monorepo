import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración optimizada para AWS Amplify
  output: 'export',
  images: {
    unoptimized: true
  },
  // Asegurar compatibilidad con Amplify
  distDir: 'out',
};

export default nextConfig;
