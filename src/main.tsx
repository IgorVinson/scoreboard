import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add this near the top of your file
window.addEventListener('unhandledrejection', event => {
  // Check if it's the specific Supabase WebSocket error
  if (event.reason && 
      event.reason.message && 
      event.reason.message.includes('message channel closed before a response')) {
    // Prevent the error from showing in the console
    event.preventDefault();
    console.log('Suppressed Supabase WebSocket error');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);