import { App } from '@tinyhttp/app';
import args from 'command-line-args';
import path from 'path';
import resolvePaths from 'vite-tsconfig-paths';
import { createServer as createViteServer, loadEnv, normalizePath, Plugin } from 'vite';

const options = args([
  { name: 'target', type: String, defaultValue: 'browser' },
  { name: 'root', type: String, defaultValue: './sandbox' }
]);

const IS_CLIENT = options.target === 'browser';
const IS_SERVER = options.target === 'server';
const envPrefix = 'APEX_';
const buildDir = 'build';
const rootDir = path.resolve(process.cwd(), options.root);
const envs = loadEnv(options.target, rootDir, envPrefix);

let defaultLevelPath = path.resolve(rootDir, envs.APEX_GAME_DEFAULT_LEVEL);
defaultLevelPath = `../../${path.relative(process.cwd(), defaultLevelPath)}`;

const vite = await createViteServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  envPrefix,
  plugins: [resolvePaths(), apexLaunchPlugin(options)],
  define: { IS_CLIENT, IS_SERVER }
});

let hasBeenLoaded = false;

async function createServer() {
  const app = new App();

  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    if (hasBeenLoaded) {
      return res.status(200).end();
    }

    try {
      const module = await vite.ssrLoadModule(path.resolve(rootDir, 'src'), {
        fixStacktrace: true
      });

      module.launch();
      hasBeenLoaded = true;

      res.status(200).end();
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });

  app.listen(3000);
}

createServer();

function apexLaunchPlugin(options: Record<string, any>): Plugin {
  return {
    name: 'apex-launch',
    config(config, { mode }) {
      if (mode === 'browser') {
        config.appType = 'spa';
        config.build = { ...config.build, outDir: `${buildDir}/${mode}` };
      }

      config.define = { ...config.define };

      for (const key in envs) {
        config.define[key] = JSON.stringify(envs[key]);
      }

      config.define.APEX_GAME_DEFAULT_LEVEL = JSON.stringify(normalizePath(defaultLevelPath));
    }
  };
}
