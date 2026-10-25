import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker with onNeedRefresh event dispatch
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      window.dispatchEvent(
        new CustomEvent('finsight:pwa-refresh', {
          detail: { reload: () => updateSW(true) },
        })
      );
    },
    onOfflineReady() {
      // offline cache primed
    },
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Clean up legacy service worker and obsolete v1 cache
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      const scriptURL =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL ||
        '';
      if (scriptURL.endsWith('/service-worker.js')) {
        registration.unregister();
      }
    }
  });
  if ('caches' in window) {
    caches.delete('v1');
  }
}