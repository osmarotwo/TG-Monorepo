import { ThemeProvider } from './contexts/ThemeContext';
import { useBrandConfig } from './utils/brandConfig';
import RegistrationForm from './components/RegistrationForm';
import ThemeToggle from './components/ThemeToggle';
import './styles/App.css';

function App() {
  const { theme } = useBrandConfig();

  return (
    <ThemeProvider defaultTheme={theme.defaultMode}>
      <div className="App">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Main Registration Form */}
        <RegistrationForm />
      </div>
    </ThemeProvider>
  );
}

export default App;