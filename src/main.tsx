import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SessionShell } from './components/SessionShell';
import { Analytics } from '@vercel/analytics/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionShell>
      <App />
      <Analytics />
    </SessionShell>
  </StrictMode>,
);
