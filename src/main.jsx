import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import './styles/scene.css';
import './styles/terminal.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// cursor spotlight: feeds --mx / --my to the CSS glow in global.css
let frame;
addEventListener('pointermove', (e) => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
    document.documentElement.style.setProperty('--my', `${e.clientY}px`);
  });
});