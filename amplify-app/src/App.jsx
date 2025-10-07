import React, { useState } from 'react';

const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function App() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);
    alert('¡Formulario funcionando! Datos: ' + JSON.stringify(formData, null, 2));
  };

  const handleGoogleSignIn = () => {
    console.log('Google Sign-In clicked');
    alert('¡Botón de Google funcionando! (Aquí se integraría con Google OAuth)');
  };

  return (
    <div className="card">
      <div className="avatar">
        👤
      </div>
      
      <h1 className="title">Crea tu cuenta</h1>
      <p className="subtitle">Únete para gestionar tus citas sin problemas.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre completo"
            className="input"
            value={formData.nombre}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Contraseña"
              className="input"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{ paddingRight: '50px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="password-help">
            La contraseña debe tener al menos 8 caracteres e incluir un número, una letra mayúscula y un carácter especial.
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary">
          Registrarse
        </button>
      </form>
      
      <div className="divider">
        <span>O regístrate con</span>
      </div>
      
      <button 
        type="button" 
        className="btn btn-google"
        onClick={handleGoogleSignIn}
      >
        <GoogleIcon />
        Continuar con Google
      </button>
      
      <div className="login-link">
        ¿Ya tienes una cuenta? <a href="#" onClick={(e) => { e.preventDefault(); alert('Ir a login'); }}>Iniciar sesión</a>
      </div>
    </div>
  );
}

export default App;