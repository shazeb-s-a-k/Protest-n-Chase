import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for offline asset caching & zero-latency local execution
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('⚡ [ServiceWorker] Game assets pinned in RAM/Cache:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚡ [ServiceWorker] Registration note:', err);
      });
  });
}

