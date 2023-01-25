import { createServer as createViteServer, loadEnv, Plugin, ResolvedConfig } from 'vite';
import path from 'node:path';
import { normalizePath } from 'vite';
import jscc from 'rollup-plugin-jscc';
import resolvePaths from 'vite-tsconfig-paths';

const envPrefix = 'APEX_';

function apexLaunchPlugin(): Plugin {
  const virtualModuleId = 'virtual:apex-launch';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  let resolvedConfig: ResolvedConfig;

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
    },
    configResolved(config) {
      resolvedConfig = config;
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return (
          'import { launchBrowser } from "apex-engine/src/launch/browser";' +
          '' +
          'export const test = () => launchBrowser(() => { console.log("called from virtual module!!")});'
        );
      }
    }
  };
}

const entryFile = normalizePath(path.resolve(process.cwd(), 'src/game/index.ts'));

await createViteServer({
  appType: 'custom',
  envPrefix,
  mode: 'server',
  server: {
    middlewareMode: true
  },
  plugins: [
    jscc({
      values: {
        _IS_CLIENT: false,
        _IS_SERVER: true
      }
    }),
    resolvePaths(),
    apexLaunchPlugin(),
    {
      name: 'exec-launcher',
      configureServer(server) {
        return async () => {
          console.log('Dev: Configuring server...');
          try {
            const module = await server.ssrLoadModule(entryFile, { fixStacktrace: true });
            await module.default();
          } catch (error) {
            server.ssrFixStacktrace(error);
          }
        };
      }
    }
  ],
  configFile: false
});
