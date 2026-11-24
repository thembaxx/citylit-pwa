import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const root = document.getElementById('root')!;
const lab = new URLSearchParams(window.location.search).get('lab');

// Dev-only creature Lab. The dynamic import keeps it out of the production
// bundle entirely; the app's normal boot is untouched.
if (import.meta.env.DEV && lab === 'creatures') {
  void import('./lab/creaturesLab').then((module) => module.mountCreaturesLab(root));
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
