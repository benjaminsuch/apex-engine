import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { cac } from 'cac';
import glob from 'glob';
import fs from 'fs-extra';
import mime from 'mime';
import { existsSync, mkdirSync, readFile } from 'node:fs';
import { createServer, Server } from 'node:http';
import { extname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rimraf } from 'rimraf';
import {
  rollup,
  watch,
  type OutputOptions,
  type Plugin,
  type RollupBuild,
  type RollupOptions
} from 'rollup';
import { WebSocketServer } from 'ws';

import { APEX_DIR, type TargetConfig, getApexConfig, defaultTargetConfig } from './config';
import { startElectron } from './electron';
import { htmlPlugin, workersPlugin } from './plugins';
import {
  createRollupPlugins,
  filterDuplicateOptions,
  getLauncherPath,
  type Launcher
} from './utils';

interface CLIOptions {
  config?: string;
  debug?: boolean;
  platform?: 'browser' | 'electron' | 'node';
  target?: 'client' | 'game' | 'server';
}

const { log } = console;

let isDebugModeOn = false;

const debug = (...args: Parameters<typeof console.debug>) =>
  isDebugModeOn && console.debug('DEBUG', ...args);

const cli = cac('apex-build-tool').version('0.1.0').help();

cli
  .option('-d, --debug', 'Shows debug messages when enabled.')
  .option('-c, --config', '[string] An optional path to the apex-config file.')
  .option('-t, --target <target>', 'client | game | server')
  .option('-p, --platform <platform>', 'browser | electron | node');

cli
  .command('serve')
  .alias('dev')
  .action(async (options: CLIOptions) => {
    filterDuplicateOptions(options);

    const { config: configFile, debug, platform, target } = options;
    const { targets } = await getApexConfig(configFile);

    if (debug) {
      isDebugModeOn = true;
    }

    if (!existsSync(APEX_DIR)) {
      mkdirSync(APEX_DIR);
    }

    const hasPlatform = targets.find(item => item.platform === platform);
    const hasTarget = targets.find(item => item.target === target);

    if (!hasPlatform) {
      console.warn(
        `No config defined for platform "${platform}". Please check your apex.config.ts.`
      );
      process.exit(0);
    }

    if (target && !hasTarget) {
      console.warn(`No config defined for target "${target}". Please check your apex.config.ts.`);
      process.exit(0);
    }

    for (let targetConfig of targets) {
      targetConfig = { ...defaultTargetConfig, ...targetConfig };

      if (platform && targetConfig.platform !== platform) {
        continue;
      }
      if (targetConfig.platform === 'browser') {
        await serveBrowserTarget(targetConfig);
      }
      if (targetConfig.platform === 'electron') {
        await serveElectronTarget(targetConfig);
      }
      if (targetConfig.platform === 'node') {
        await serveNodeTarget(targetConfig);
      }
    }
  });

cli.command('build').action(async (options: CLIOptions) => {
  filterDuplicateOptions(options);

  const { config: configFile, debug, platform } = options;
  const { targets } = await getApexConfig(configFile);

  if (debug) {
    isDebugModeOn = true;
  }

  for (let targetConfig of targets) {
    targetConfig = { ...defaultTargetConfig, ...targetConfig };

    if (platform && targetConfig.platform !== platform) {
      continue;
    }
    if (targetConfig.platform === 'browser') {
      await buildBrowserTarget(targetConfig);
    }
    if (targetConfig.platform === 'electron') {
      await buildElectronTarget(targetConfig);
    }
    if (targetConfig.platform === 'node') {
      await buildNodeTarget(targetConfig);
    }
  }

  process.exit();
});

cli.parse();

async function buildBrowserTarget(target: TargetConfig) {
  const buildDir = resolve('build/browser');

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

  let bundle: RollupBuild | undefined;

  try {
    bundle = await rollup({
      ...createRollupConfig('browser'),
      plugins: [workersPlugin({ target }), ...createRollupPlugins(buildDir, target), htmlPlugin()],
      onwarn() {}
    });

    await bundle.write({
      dir: buildDir,
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    });
  } catch (error) {
    debug(error);
  }

  if (bundle) {
    await bundle.close();
  }
}

async function buildElectronTarget(target: TargetConfig) {
  const buildDir = resolve('build/electron');

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

  let mainBundle: RollupBuild | undefined;
  let sandboxBundle: RollupBuild | undefined;

  process.env['ELECTRON_RENDERER_URL'] = join(process.cwd(), 'build/electron/index.html');

  try {
    mainBundle = await rollup({
      ...createRollupConfig('electron-main', {
        input: {
          main: getLauncherPath('electron-main')
        },
        plugins: [workersPlugin({ target }), ...createRollupPlugins(buildDir, target)],
        external: ['electron'],
        onwarn() {}
      })
    });

    sandboxBundle = await rollup({
      ...createRollupConfig('electron-sandbox', {
        input: {
          sandbox: getLauncherPath('electron-sandbox')
        },
        plugins: [
          // electron-sandbox is a browser, so we change the platform to "browser".
          workersPlugin({ target: { ...target, platform: 'browser' } }),
          ...createRollupPlugins(buildDir, { ...target, platform: 'browser' }),
          htmlPlugin('./sandbox.js', {
            meta: [
              {
                'http-equiv': 'Content-Security-Policy',
                content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
              }
            ]
          })
        ],
        onwarn() {}
      })
    });

    const outputOptions: OutputOptions = {
      dir: buildDir,
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    };

    await mainBundle.write({ ...outputOptions, entryFileNames: '[name].cjs', format: 'cjs' });
    await sandboxBundle.write(outputOptions);
  } catch (error) {
    debug(error);
  }

  if (mainBundle) {
    await mainBundle.close();
  }
  if (sandboxBundle) {
    await sandboxBundle.close();
  }
}

async function buildNodeTarget(target: TargetConfig) {
  const buildDir = resolve('build/node');

  let bundle: RollupBuild | undefined;

  try {
    bundle = await rollup({
      ...createRollupConfig('node'),
      plugins: [
        workersPlugin({ target }),
        replace({
          preventAssignment: true,
          values: {
            DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
          }
        }),
        nodeResolve({ preferBuiltins: true }),
        typescript({ esModuleInterop: true, outDir: buildDir })
      ],
      onwarn() {}
    });

    await bundle.write({
      dir: buildDir,
      entryFileNames: `[name].mjs`,
      chunkFileNames: '[name]-[hash].mjs',
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    });
  } catch (error) {
    debug(error);
  }

  if (bundle) {
    await bundle.close();
  }
}

let server: Server;

async function serveBrowserTarget(target: TargetConfig) {
  const buildDir = resolve(APEX_DIR, 'build/browser');
  const wss = new WebSocketServer({ host: 'localhost', port: 24678 });

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

  fs.copy('src/assets', resolve(buildDir, 'assets'), err => {
    if (err) {
      console.error('Error copying folder:', err);
    }
  });

  wss.on('connection', ws => {
    ws.on('error', console.error);
  });

  server = createServer((req, res) => {
    const unsafePath = decodeURI((req.url ?? '').split('?')[0]);
    const urlPath = posix.normalize(unsafePath);

    readFileFromContentBase(buildDir, urlPath, (error, content, filePath) => {
      if (!error) {
        res.writeHead(200, {
          'Content-Type': mime.getType(filePath) ?? 'text/plain',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp'
        });
        res.end(content, 'utf-8');
      } else {
        if (filePath.includes('favicon')) {
          return;
        }
        console.log(error);
      }
    });
  });

  closeServerOnTermination();

  const watcher = watch({
    ...createRollupConfig('browser', {
      output: {
        dir: buildDir
      },
      plugins: [
        workersPlugin({ target }),
        ...createRollupPlugins(buildDir, target),
        htmlPlugin(
          './index.js',
          {},
          [
            `<script type="module">`,
            `  const ws = new WebSocket('ws://localhost:24678')`,
            ``,
            `  ws.addEventListener('message', async ({data}) => {`,
            ``,
            `    let parsed`,
            ``,
            `    try {`,
            `      parsed = JSON.parse(String(data))`,
            `    } catch {}`,
            ``,
            `    if (parsed && parsed.type === 'update') {`,
            `      window.location.reload()`,
            `    }`,
            `  })`,
            `</script>`
          ].join('\n')
        )
      ],
      onwarn() {}
    })
  });

  watcher.on('event', async event => {
    log(`[${new Date().toLocaleTimeString()}] [browser:watcher]`, event.code);

    if (event.code === 'END') {
      if (!server.listening) {
        server.listen(3000, 'localhost', () => {
          log('\nLocal: http://localhost:3000');
        });
      }
    }

    if (event.code === 'BUNDLE_END') {
      wss.clients.forEach(socket => {
        socket.send(JSON.stringify({ type: 'update' }));
      });

      event.result.close();
    }

    if (event.code === 'ERROR') {
      console.log(event);
    }
  });

  watcher.on('change', file => {
    log(`\n[${new Date().toLocaleTimeString()}] [browser:watcher]`, 'File changed');
    debug(file);
  });

  watcher.on('restart', () => {});

  watcher.on('close', () => {});

  watcher.close();
}

async function serveElectronTarget(target: TargetConfig) {
  const buildDir = resolve(APEX_DIR, 'build/electron');

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

  fs.copy('src/assets', resolve(buildDir, 'assets'), err => {
    if (err) {
      console.error('Error copying folder:', err);
    }
  });

  process.env['ELECTRON_RENDERER_URL'] = join(process.cwd(), '.apex/build/electron/index.html');

  const watcherMain = watch({
    ...createRollupConfig('electron-main', {
      input: {
        main: getLauncherPath('electron-main')
      },
      output: {
        dir: buildDir,
        format: 'cjs',
        sourcemap: false
      },
      plugins: createRollupPlugins(buildDir, target),
      external: ['electron'],
      onwarn() {}
    })
  });

  watcherMain.on('event', event => {
    log('[electron-main:watcher]', event.code);

    if (event.code === 'ERROR') {
      console.log(event.error);
    }
  });

  watcherMain.on('change', file => {
    log('[electron-main:watcher]', 'File changed');
    debug(file);
  });

  watcherMain.on('restart', () => {});

  watcherMain.on('close', () => {});

  const watcherSandbox = watch({
    ...createRollupConfig('electron-sandbox', {
      input: {
        sandbox: getLauncherPath('electron-sandbox'),
        ...getGameMaps()
      },
      output: {
        dir: buildDir
      },
      plugins: [
        // electron-sandbox is a browser, so we change the platform to "browser".
        workersPlugin({ target: { ...target, platform: 'browser' } }),
        ...createRollupPlugins(buildDir, { ...target, platform: 'browser' }),
        htmlPlugin('./sandbox.js')
      ],
      onwarn() {}
    })
  });

  let isRunning = false;

  watcherSandbox.on('event', event => {
    log('[electron-sandbox:watcher]', event.code);

    if (event.code === 'BUNDLE_END') {
      // send message to electron-main to reload (via MessageChannel)
    }
    if (event.code === 'END' && !isRunning) {
      startElectron(buildDir + '/main.js');
      isRunning = true;
    }
  });

  watcherSandbox.on('change', file => {
    log('[electron-sandbox:watcher]', 'File changed');
    debug(file);
  });

  watcherSandbox.on('restart', () => {});

  watcherSandbox.on('close', () => {});
}

async function serveNodeTarget(target: TargetConfig) {
  const buildDir = resolve(APEX_DIR, 'build/node');

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

  const watcher = watch({
    ...createRollupConfig('node', {
      output: {
        dir: buildDir,
        chunkFileNames: '[name]-[hash].mjs',
        entryFileNames: `[name].mjs`,
        externalLiveBindings: false,
        format: 'esm',
        freeze: false,
        sourcemap: false
      },
      plugins: [workersPlugin({ target }), ...createRollupPlugins(buildDir, target)],
      onwarn() {}
    })
  });

  watcher.on('event', async event => {
    log('[node:watcher]', event.code);

    if (event.code === 'ERROR') {
      console.log(event);
    }

    if (event.code === 'BUNDLE_END') {
      event.result.close();
    }
  });

  watcher.close();
}

function readFileFromContentBase(
  contentBase: string,
  urlPath: string,
  callback: (err: NodeJS.ErrnoException | null, data: Buffer, filePath: string) => void
) {
  let filePath = resolve(contentBase, '.' + urlPath);

  if (urlPath.endsWith('/')) {
    filePath = resolve(filePath, 'index.html');
  }

  debug('reading file:', filePath);

  readFile(filePath, (error, content) => {
    callback(error, content, filePath);
  });
}

function closeServerOnTermination() {
  const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];
  terminationSignals.forEach(signal => {
    process.on(signal, () => {
      debug('process signal:', signal);

      if (server) {
        debug('closing server...');

        server.close();
        process.exit();
      }
    });
  });
}

function getEngineSourceFiles() {
  return Object.fromEntries(
    glob
      .sync('src/engine/**/*.ts')
      .map(file => [
        relative('src', file.slice(0, file.length - extname(file).length)),
        fileURLToPath(pathToFileURL(resolve(file)))
      ])
  );
}

function getGameMaps() {
  return Object.fromEntries(
    glob
      .sync('src/game/maps/**/*.ts')
      .map(file => [
        relative('src/game', file.slice(0, file.length - extname(file).length)),
        fileURLToPath(pathToFileURL(resolve(file)))
      ])
  );
}

function createRollupConfig(
  launcher: Launcher,
  { output, ...options }: RollupOptions = {}
): RollupOptions {
  const input = {
    index: getLauncherPath(launcher),
    ...getEngineSourceFiles(),
    ...getGameMaps()
  };

  return {
    input,
    output: {
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline',
      chunkFileNames: '[name].js',
      // manualChunks: {
      //   vendor: ['three']
      // },
      ...output
    },
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    },
    ...options
  };
}
