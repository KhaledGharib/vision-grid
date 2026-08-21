import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

try {
  const lang = localStorage.getItem('vg:lang') === 'ar' ? 'ar' : 'en';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
} catch {
  /* private mode with storage denied: English LTR is the right default */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
