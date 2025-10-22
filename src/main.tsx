import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from "./App.tsx";
import { registerSW } from '@/lib/pwa';
import { initDatabase } from '@/lib/rxdb';
import { dbLogger } from '@/lib/logger';

// App wrapper component for RxDB initialization and service worker
function AppWrapper() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Initialize RxDB before rendering app
    initDatabase()
      .then(() => {
        dbLogger.success('RxDB initialized successfully');
        setDbReady(true);
      })
      .catch((error) => {
        dbLogger.error('Failed to initialize RxDB:', error);
      });

    // Register service worker only in production
    if (import.meta.env.PROD) {
      registerSW();
    }
  }, []);

  if (!dbReady) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading database...
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppWrapper />
    </StrictMode>,
)
