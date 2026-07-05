import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/lib/analytics';
import './src/index.css';

// Unregister any stale service workers (avoids serving cached old assets).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
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