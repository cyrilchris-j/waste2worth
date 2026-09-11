import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

// Clean up any stale service workers or caches that interfere with dev server modules
if (import.meta.env.DEV) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) reg.unregister();
    });
  }
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) caches.delete(name);
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
