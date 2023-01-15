import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, Plugin } from 'vite';
import resolvePaths from 'vite-tsconfig-paths';
import path from 'path';

const envPrefix = 'APEX_';

function apexLaunchPlugin(): Plugin {
  return {
    name: 'apex-launch',
    config(config, { mode }) {
      if (mode === 'browser') {
        config.appType = 'spa';
      }

      config.define = { ...config.define };

      const envs = loadEnv(mode, path.resolve(process.cwd(), './sandbox'), envPrefix);

      for (const key in envs) {
        config.define[key] = JSON.stringify(envs[key]);
      }
    }
  };
}

export default defineConfig({
  appType: 'custom',
  root: './sandbox',
  envPrefix,
  server: {
    port: 3000
  },
  plugins: [resolvePaths(), react(), apexLaunchPlugin()],
  define: {
    IS_CLIENT: process.env.IS_CLIENT,
    IS_SERVER: process.env.IS_SERVER
  }
});
