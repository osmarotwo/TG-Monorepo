'use client';

import { useEffect, useState } from 'react';

export default function DebugTokenPage() {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);

  const clearTokensAndReload = () => {
    localStorage.clear();
    location.reload();
  };

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('No hay token en localStorage');
        return;
      }

      // Decodificar JWT (solo la parte del payload)
      const parts = token.split('.');
      if (parts.length !== 3) {
        setError('Token JWT inválido');
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      const hasValidSessionId = typeof payload.sessionId === 'string' && payload.sessionId.includes('-');
      
      setIsValid(hasValidSessionId);
      setTokenInfo({
        token: token,
        payload: payload,
        sessionId: payload.sessionId,
        sessionIdType: hasValidSessionId ? 'UUID ✅' : 'Timestamp ❌ (OBSOLETO)',
        userId: payload.userId,
        email: payload.email,
        exp: new Date(payload.exp * 1000).toLocaleString(),
        isExpired: payload.exp * 1000 < Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Debug Token JWT</h1>
      
      {error && (
        <div style={{ background: '#fee', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={clearTokensAndReload}
            style={{ 
              marginLeft: '10px', 
              padding: '5px 10px', 
              background: '#d00', 
              color: 'white', 
              border: 'none', 
              borderRadius: '3px', 
              cursor: 'pointer' 
            }}
          >
            Limpiar tokens y recargar
          </button>
        </div>
      )}
      
      {tokenInfo && !isValid && (
        <div style={{ background: '#ff9', padding: '15px', borderRadius: '5px', marginBottom: '20px', border: '2px solid #f90' }}>
          <strong>⚠️ TOKEN OBSOLETO DETECTADO</strong>
          <div style={{ marginTop: '10px' }}>
            Este token tiene un sessionId en formato antiguo (timestamp). 
            Necesitas limpiarlo y hacer login nuevamente.
          </div>
          <button 
            onClick={clearTokensAndReload}
            style={{ 
              marginTop: '10px', 
              padding: '8px 15px', 
              background: '#f90', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🗑️ Limpiar tokens y recargar
          </button>
        </div>
      )}
      
      {tokenInfo && isValid && (
        <div style={{ background: '#dfd', padding: '15px', borderRadius: '5px', marginBottom: '20px', border: '2px solid #0a0' }}>
          <strong>✅ TOKEN VÁLIDO</strong>
          <div style={{ marginTop: '5px' }}>
            Tu token tiene el formato correcto (sessionId UUID)
          </div>
        </div>
      )}
      
      {tokenInfo && (
        <div>
          <h2>Información del Token</h2>
          
          <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', marginBottom: '10px' }}>
            <strong>SessionId:</strong> 
            <div style={{ fontSize: '14px', wordBreak: 'break-all', marginTop: '5px' }}>
              {tokenInfo.sessionId}
            </div>
            <div style={{ marginTop: '5px', color: tokenInfo.sessionIdType.includes('✅') ? 'green' : 'red' }}>
              Tipo: {tokenInfo.sessionIdType}
            </div>
          </div>

          <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', marginBottom: '10px' }}>
            <strong>UserId:</strong> 
            <div style={{ fontSize: '14px', marginTop: '5px' }}>
              {tokenInfo.userId}
            </div>
          </div>

          <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', marginBottom: '10px' }}>
            <strong>Email:</strong> 
            <div style={{ fontSize: '14px', marginTop: '5px' }}>
              {tokenInfo.email}
            </div>
          </div>

          <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', marginBottom: '10px' }}>
            <strong>Expira:</strong> 
            <div style={{ fontSize: '14px', marginTop: '5px' }}>
              {tokenInfo.exp}
            </div>
          </div>

          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Ver Payload Completo</summary>
            <pre style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', marginTop: '10px', overflow: 'auto' }}>
              {JSON.stringify(tokenInfo.payload, null, 2)}
            </pre>
          </details>

          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Ver Token Completo</summary>
            <pre style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', marginTop: '10px', overflow: 'auto', fontSize: '10px' }}>
              {tokenInfo.token}
            </pre>
          </details>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
        <h3>🔑 ¿Qué significa esto?</h3>
        <ul>
          <li><strong>UUID ✅</strong>: SessionId correcto (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)</li>
          <li><strong>Timestamp ❌</strong>: SessionId antiguo (números como 1760546677656)</li>
        </ul>
        <p style={{ marginTop: '10px' }}>
          Si ves "Timestamp ❌", necesitas hacer logout y volver a autenticarte con Google.
        </p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
          }}
          style={{
            background: '#dc3545',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🗑️ Limpiar Todo y Volver al Inicio
        </button>
      </div>
    </div>
  );
}
