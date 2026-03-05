import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: https://99sunshine.github.io/meta-create/
export default defineConfig({
  plugins: [react()],
  base: '/meta-create/',
});
