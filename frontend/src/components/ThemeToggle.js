import React, { useEffect, useState } from 'react';

import {
  FaMoon,
  FaSun
} from 'react-icons/fa';

export default function ThemeToggle() {

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {

    const theme = darkMode ? 'dark' : 'light';

    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    localStorage.setItem('theme', theme);

  }, [darkMode]);

  function toggleTheme() {
    setDarkMode(current => !current);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={
        darkMode
          ? 'Ativar modo claro'
          : 'Ativar modo escuro'
      }
      aria-label={
        darkMode
          ? 'Ativar modo claro'
          : 'Ativar modo escuro'
      }
    >
      {darkMode ? <FaSun /> : <FaMoon />}
    </button>
  );
}