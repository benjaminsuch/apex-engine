import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import resolvePaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: './sandbox',
  server: {
    port: 3000
  },
  plugins: [resolvePaths({ root: './sandbox' }), react()]
});
