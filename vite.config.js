import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 no necesita tailwind.config.js ni postcss.config.js:
// el plugin de Vite se encarga de todo, y los tokens de diseño
// (colores, tipografías) se definen directamente en src/index.css
// dentro de un bloque @theme.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
