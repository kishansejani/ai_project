// frontend/src/components/SettingsPage.jsx
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

const accentColors = [
  '#007bff', // Blue
  '#28a745', // Green
  '#dc3545', // Red
  '#ffc107', // Yellow
  '#6f42c1', // Purple
  '#fd7e14', // Orange
];

const SettingsPage = () => {
  const { theme, setTheme, accentColor, setAccentColor } = useSettings();

  return (
    <div className="settings-container">
      <h2>સેટિંગ્સ</h2>
      <div>
        <h3>થીમ</h3>
        <button onClick={() => setTheme('light')} style={{backgroundColor: theme === 'light' ? 'var(--primary-color)' : 'gray'}}>
          લાઇટ મોડ
        </button>
        <button onClick={() => setTheme('dark')} style={{backgroundColor: theme === 'dark' ? 'var(--primary-color)' : 'gray'}}>
          ડાર્ક મોડ
        </button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3>એક્સેંટ કલર</h3>
        {accentColors.map((color) => (
          <span
            key={color}
            className={`color-option ${accentColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setAccentColor(color)}
            title={color}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;