import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { WorkspaceUIProvider } from './components/WorkspaceUI';
import './index.css';
import { SessionShell } from './components/SessionShell';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkspaceUIProvider><SessionShell><App /></SessionShell></WorkspaceUIProvider>
  </StrictMode>,
);

