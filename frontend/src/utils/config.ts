// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000,
}

// App Configuration
export const APP_CONFIG = {
  NAME: 'Frontend React App',
  VERSION: '1.0.0',
  DESCRIPTION: 'Modern React application with Vite and TypeScript',
}

// Environment
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
}