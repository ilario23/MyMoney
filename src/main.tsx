import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from "./App.tsx";
import { registerSW } from '@/lib/pwa';

// App wrapper component for registering service worker
function AppWrapper() {
  useEffect(() => {
    // Register service worker only in production
    if (import.meta.env.PROD) {
      registerSW();
    }
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppWrapper />
    </StrictMode>,
)
