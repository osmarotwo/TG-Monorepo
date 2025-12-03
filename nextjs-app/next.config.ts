import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración optimizada para AWS Amplify
  output: 'export',
  images: {
    unoptimized: true
  },
  // Asegurar compatibilidad con Amplify
  distDir: 'out',
  // Deshabilitar ESLint durante build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Deshabilitar TypeScript strict checks durante build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
