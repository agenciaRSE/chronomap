import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/lib/analytics';
import './src/index.css';

// Register the offline-fallback service worker (needed for the Android/Play Store app).
// It replaces any older worker on this scope and deletes its caches, so stale assets can't be served.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);