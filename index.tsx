import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';

// After a deploy, sessions loaded before it still reference old hashed chunks
// (e.g. Checkout-<hash>.js) that no longer exist — lazy routes then crash until
// a manual refresh. Vite fires `vite:preloadError` for exactly this; reload once
// to pick up the new index.html. Session flag prevents a reload loop.
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'rf_chunk_reload_at';
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last < 30_000) return; // already tried — let the error surface
  sessionStorage.setItem(KEY, String(Date.now()));
  event.preventDefault();
  window.location.reload();
});

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