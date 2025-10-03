import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useBrandConfig } from './utils/brandConfig';
import RegistrationForm from './components/RegistrationForm';
import Dashboard from './components/Dashboard';
import ThemeToggle from './components/ThemeToggle';
import './styles/App.css';

// Componente interno que usa useAuth
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {/* Theme Toggle */}
      <ThemeToggle />
      
      {/* Mostrar Dashboard si está autenticado, sino RegistrationForm */}
      {isAuthenticated ? <Dashboard /> : <RegistrationForm />}
    </div>
  );
};

function App() {
  const { theme } = useBrandConfig();

  return (
    <ThemeProvider defaultTheme={theme.defaultMode}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;