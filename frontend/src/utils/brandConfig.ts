/**
 * Configuración dinámica de la plataforma
 * Aquí puedes cambiar fácilmente el nombre, logo, colores y textos de la aplicación
 */

export interface BrandConfig {
  platform: {
    name: string;
    tagline: string;
    description: string;
  };
  branding: {
    primaryColor: string;
    logoType: 'icon' | 'image' | 'text';
    logoConfig: {
      icon?: string; // Nombre del icono SVG
      image?: string; // URL o path de la imagen
      text?: string; // Texto del logo
    };
  };
  theme: {
    defaultMode: 'light' | 'dark' | 'system';
    glassmorphism: boolean;
  };
  content: {
    registration: {
      title: string;
      subtitle: string;
      submitText: string;
      alternativeText: string;
      loginLinkText: string;
      passwordRequirements: string;
    };
  };
}

export const brandConfig: BrandConfig = {
  platform: {
    name: "MiPlataforma", // 🔧 Cambiar aquí el nombre
    tagline: "Gestiona tus citas de manera eficiente",
    description: "La mejor plataforma para administrar tus citas y servicios"
  },
  branding: {
    primaryColor: "#13a4ec", // 🔧 Color principal
    logoType: "icon", // 🔧 Tipo de logo: 'icon', 'image', 'text'
    logoConfig: {
      icon: "user", // 🔧 Nombre del icono (user, calendar, star, etc.)
      // image: "/logo.png", // 🔧 Descomenta para usar imagen
      // text: "MP", // 🔧 Descomenta para usar texto
    }
  },
  theme: {
    defaultMode: "light", // 🔧 Tema por defecto
    glassmorphism: true // 🔧 Efecto glassmorphism
  },
  content: {
    registration: {
      title: "Crea tu cuenta",
      subtitle: "Únete para gestionar tus citas sin problemas.",
      submitText: "Registrarse",
      alternativeText: "O regístrate con",
      loginLinkText: "Iniciar sesión",
      passwordRequirements: "La contraseña debe tener al menos 8 caracteres e incluir un número, una letra mayúscula y un carácter especial."
    }
  }
};

/**
 * Hook para acceder fácilmente a la configuración
 */
export const useBrandConfig = () => {
  return brandConfig;
};

/**
 * Función para obtener colores CSS custom properties
 */
export const getCSSVariables = () => {
  return {
    '--primary-color': brandConfig.branding.primaryColor,
    '--primary-rgb': hexToRgb(brandConfig.branding.primaryColor),
  };
};

/**
 * Utilidad para convertir hex a RGB
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '19, 164, 236'; // fallback
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r}, ${g}, ${b}`;
}