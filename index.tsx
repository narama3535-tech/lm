import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color:red; padding:20px;">CRITICAL ERROR: Root element not found.</div>';
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  console.error("Mounting Error:", e);
  rootElement.innerHTML = `<div style="color:white; background:black; padding:20px; font-family:monospace;">
    <h1>SYSTEM FAILURE</h1>
    <p>Failed to mount React application.</p>
    <pre>${e instanceof Error ? e.message : String(e)}</pre>
  </div>`;
}