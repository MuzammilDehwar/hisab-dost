import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline PWA functionality
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);

const startupSplash = document.getElementById('startup-splash');
const hideStartupSplash = () => startupSplash?.classList.add('is-ready');
window.addEventListener('hisab-dost-ready', hideStartupSplash, { once: true });
// A network outage must never leave the user staring at a splash forever.
window.setTimeout(hideStartupSplash, 9000);
