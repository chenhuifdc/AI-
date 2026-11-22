import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {GlossaryProvider} from './context/GlossaryContext';
import './index.css';

registerSW({
  immediate: true,
});

createRoot(document.getElementById('root')!).render(
  <GlossaryProvider>
    <App />
  </GlossaryProvider>
);

