import replace from '@rollup/plugin-replace';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'build/browser'
  },
  server: {
    port: 3000
  },
  plugins: [
    react(),
    replace({
      preventAssignment: true,
      values: {
        IS_CLIENT: 'false',
        IS_DEDICATED_SERVER: 'false',
        IS_LISTEN_SERVER: 'false',
        IS_SERVER: 'false',
        IS_STANDALONE: 'false'
      }
    })
  ]
});
