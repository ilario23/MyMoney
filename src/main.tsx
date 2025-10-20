import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from "./App.tsx";

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    console.log('ServiceWorker registration successful:', registration.scope);
  }).catch((error) => {
    console.log('ServiceWorker registration failed:', error);
  });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
