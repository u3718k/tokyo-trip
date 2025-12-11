import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- Tailwind Injection Helper ---
// This ensures Tailwind loads even if the environment strips scripts from index.html
const injectTailwind = () => {
  if (document.getElementById('tailwind-cdn')) return;

  // 1. Create the Config Script
  // We use a polling mechanism to ensure the config is applied as soon as Tailwind library loads
  const configScript = document.createElement('script');
  configScript.innerHTML = `
    const initTailwind = () => {
      if (window.tailwind) {
        window.tailwind.config = {
          theme: {
            extend: {
              fontFamily: {
                sans: ['"Zen Maru Gothic"', 'sans-serif'],
              },
              colors: {
                muji: {
                  bg: '#f9f9f6',
                  card: '#ffffff',
                  text: '#4a4a4a',
                  muted: '#9ca3af',
                  accent: '#78716c',
                  highlight: '#d97706',
                  primary: '#57534e',
                }
              }
            }
          }
        };
      } else {
        setTimeout(initTailwind, 20);
      }
    };
    initTailwind();
  `;
  document.head.appendChild(configScript);

  // 2. Load the Tailwind CDN
  const script = document.createElement('script');
  script.id = 'tailwind-cdn';
  script.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(script);
};

// Execute Injection
injectTailwind();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);