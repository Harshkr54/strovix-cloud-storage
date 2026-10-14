import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

try {
  const stored = localStorage.getItem('nimbus-theme');
  if (stored === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch {
  // ignore
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
