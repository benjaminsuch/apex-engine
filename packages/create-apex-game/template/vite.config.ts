import nodeResolve from '@rollup/plugin-node-resolve';
import { defineConfig, loadEnv, Plugin } from 'vite';
import resolvePaths from 'vite-tsconfig-paths';

const envPrefix = 'APEX_';

function apexLaunchPlugin(): Plugin {
  return {
    name: 'apex-launch',
    config(config, { mode }) {
      config.define = { ...config.define, IS_CLIENT: false, IS_SERVER: false };

      if (mode === 'browser') {
        config.appType = 'spa';
        config.define.IS_CLIENT = true;
      }

      if (mode === 'server') {
        config.define.IS_SERVER = true;
      }

      const envs = loadEnv(mode, './', envPrefix);

      for (const key in envs) {
        config.define[key] = JSON.stringify(envs[key]);
      }
    }
  };
}

export default defineConfig({
  appType: 'spa',
  envPrefix,
  server: {
    port: 3000
  },
  plugins: [nodeResolve(), resolvePaths(), apexLaunchPlugin()]
});
