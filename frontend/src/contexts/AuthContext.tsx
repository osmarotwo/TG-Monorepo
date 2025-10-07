import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signInWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  completeProfile: (profileData: { fullName: string; email: string; phone: string; birthDate: string }) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Google Client ID - En producción esto vendría de variables de entorno
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';

// Variable para controlar si Google OAuth está en proceso
let isGoogleSignInInProgress = false;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para decodificar JWT de Google
  const decodeJWT = (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      throw new Error('Invalid token');
    }
  };

  // Callback para manejar respuesta de Google
  const handleGoogleSignIn = async (response: any) => {
    try {
      setLoading(true);
      const userInfo = decodeJWT(response.credential);
      
      const authUser: any = {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        provider: 'google',
        emailVerified: userInfo.email_verified,
      };

      // Simular registro/login con backend
      await simulateBackendCall(authUser);
      
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      
      console.log('Google sign-in successful:', authUser);
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Error en el registro con Google. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Simular llamada al backend
  const simulateBackendCall = async (user: any): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('User registered/logged in:', user);
        resolve();
      }, 1000);
    });
  };

  // Inicializar Google Identity Services y manejar redirect de OAuth
  useEffect(() => {
    const initializeGoogle = () => {
      if ((window as any).google && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id') {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signup',
          });
          console.log('Google Identity Services initialized successfully');
        } catch (error) {
          console.error('Error initializing Google Identity Services:', error);
        }
      }
      setLoading(false);
    };

    // Verificar si venimos de un redirect de Google OAuth
    const handleOAuthRedirect = () => {
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = urlParams.get('access_token');
      const idToken = urlParams.get('id_token');
      const state = urlParams.get('state');
      const storedState = sessionStorage.getItem('oauth_state');
      
      console.log('OAuth redirect check:', {
        hasAccessToken: !!accessToken,
        hasIdToken: !!idToken,
        state,
        storedState,
        stateMatches: state === storedState
      });

      if (accessToken && idToken && state && state === storedState) {
        console.log('Processing OAuth redirect...');
        
        // Limpiar parámetros de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Limpiar sessionStorage
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_nonce');
        
        // Procesar el token
        try {
          const userInfo = decodeJWT(idToken);
          const authUser: any = {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            provider: 'google',
            emailVerified: userInfo.email_verified,
            profileCompleted: false, // Siempre false para nuevos usuarios de Google
          };

          setUser(authUser);
          localStorage.setItem('auth_user', JSON.stringify(authUser));
          console.log('Google OAuth redirect successful:', authUser);
          
          isGoogleSignInInProgress = false;
          setLoading(false);
          return true; // Indica que se procesó el redirect
        } catch (error) {
          console.error('Error processing OAuth redirect:', error);
          isGoogleSignInInProgress = false;
        }
      }
      return false; // No se procesó redirect
    };

    // Verificar redirect primero
    const redirectProcessed = handleOAuthRedirect();

    // Solo inicializar Google si no se procesó un redirect
    if (!redirectProcessed) {
      if ((window as any).google) {
        initializeGoogle();
      } else {
        // Esperar a que se cargue el script
        const checkGoogle = setInterval(() => {
          if ((window as any).google) {
            clearInterval(checkGoogle);
            initializeGoogle();
          }
        }, 100);

        // Timeout después de 10 segundos
        setTimeout(() => {
          clearInterval(checkGoogle);
          if (!(window as any).google) {
            console.error('Google Identity Services failed to load');
            setLoading(false);
          }
        }, 10000);
      }
    }

    // Recuperar usuario del localStorage
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  // Sign in con Google - OAuth 2.0 directo sin FedCM
  const signInWithGoogle = async () => {
    try {
      if (isGoogleSignInInProgress) {
        console.log('Google sign-in already in progress');
        return;
      }

      isGoogleSignInInProgress = true;
      console.log('Starting Google OAuth redirect...');

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google Client ID not configured');
      }

      // Generate state and nonce for security
      const state = `google_oauth_${Date.now()}`;
      const nonce = `nonce_${Date.now()}`;
      
      // Store state for verification
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_nonce', nonce);

      // OAuth 2.0 parameters
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: window.location.origin,
        scope: 'openid email profile',
        response_type: 'token id_token',
        state: state,
        nonce: nonce
      });

      // Redirect to Google OAuth - ENDPOINT CORRECTO
      const authUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
      console.log('Redirecting to:', authUrl);
      window.location.href = authUrl;

    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setError(error instanceof Error ? error.message : 'Google sign-in failed');
      isGoogleSignInInProgress = false;
    }
  };  // Sign in con email/password (simulado)
  // Función para completar el perfil
  const completeProfile = async (profileData: { fullName: string; email: string; phone: string; birthDate: string }) => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Actualizar usuario con los datos del perfil
      const updatedUser: any = {
        ...user,
        name: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        birthDate: profileData.birthDate,
        profileCompleted: true,
      };

      // Simular llamada al backend
      await simulateBackendCall(updatedUser);
      
      // Actualizar estado local
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      
      console.log('Profile completed successfully:', updatedUser);
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      
      // Simular validación y registro
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const authUser: any = {
        id: `manual_${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=13a4ec&color=fff`,
        provider: 'manual',
        emailVerified: false,
      };

      await simulateBackendCall(authUser);
      
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      
      console.log('Email sign-in successful:', authUser);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    
    // Revoke Google session if it was a Google user
    if (user?.provider === 'google' && (window as any).google) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
    
    console.log('User signed out');
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    completeProfile,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};