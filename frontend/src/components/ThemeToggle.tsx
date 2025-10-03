import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Icon } from './ui';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return isDark ? 'moon' : 'sun';
    }
    return theme === 'light' ? 'sun' : 'moon';
  };

  const getTitle = () => {
    if (theme === 'system') {
      return `Tema del sistema (${isDark ? 'oscuro' : 'claro'})`;
    }
    return theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      title={getTitle()}
      className="fixed top-4 right-4 z-50"
    >
      <Icon name={getIcon()} size="sm" />
    </Button>
  );
};

export default ThemeToggle;