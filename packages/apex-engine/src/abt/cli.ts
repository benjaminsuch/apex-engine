import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { cac } from 'cac';
import glob from 'glob';
import mime from 'mime';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFile,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { createServer, Server } from 'node:http';
import { dirname, extname, join, posix, relative, resolve } from 'node:path';
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

import { APEX_DIR, CONFIG_FILE_NAME, Platform, type ApexConfig, type TargetConfig } from './config';
import { startElectron } from './electron';
import { dynamicImport, getLauncherPath, htmlPlugin, type Launcher } from './utils';

interface CLIOptions {
  config?: string;
  debug?: boolean;
  platform?: 'browser' | 'electron' | 'node';
  target?: 'client' | 'game' | 'server';
}

const wss = new WebSocketServer({ host: 'localhost', port: 24678 });
const { log } = console;

let isDebugModeOn = false;

const debug = (...args: Parameters<typeof console.debug>) =>
  isDebugModeOn && console.debug('DEBUG', ...args);

wss.on('connection', ws => {
  console.log('client connected');
  ws.on('error', console.error);
});

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

    const { config: configFile, debug, platform } = options;
    const { targets } = await getApexConfig();

    if (debug) {
      isDebugModeOn = true;
    }

    if (!existsSync(APEX_DIR)) {
      mkdirSync(APEX_DIR);
    }

    for (const targetConfig of targets) {
      if (platform && targetConfig.platform !== platform) {
        continue;
      }
      if (targetConfig.platform === 'browser') {
        await serveBrowserTarget(targetConfig);
      }
      if (targetConfig.platform === 'electron') {
        await serveElectronTarget(targetConfig);
      }
    }
  });

cli.command('build').action(async (options: CLIOptions) => {
  filterDuplicateOptions(options);

  const { config: configFile, debug, platform } = options;
  const { targets } = await getApexConfig();

  if (debug) {
    isDebugModeOn = true;
  }

  for (const targetConfig of targets) {
    if (platform && targetConfig.platform !== platform) {
      continue;
    }
    await buildTarget(targetConfig);
  }

  process.exit();
});

cli.parse();

function filterDuplicateOptions<T extends object>(options: T) {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1];
    }
  }
}

async function getApexConfig() {
  let bundle: RollupBuild | undefined;
  let config: ApexConfig | undefined;

  try {
    bundle = await rollup({
      input: resolve(`${CONFIG_FILE_NAME}.ts`),
      plugins: [nodeResolve({ preferBuiltins: true }), typescript()],
      onwarn() {}
    });

    const result = await bundle.generate({
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    });
    const chunkOrAsset = result.output[0];

    if (chunkOrAsset.type === 'chunk') {
      config = await loadConfigFromBundledFile(process.cwd(), chunkOrAsset.code);
    }
  } catch (error) {
    console.log(error);
    debug(error);
  }

  if (bundle) {
    await bundle.close();
  }

  if (!config) {
    throw new Error(`No config found.`);
  }

  return config;
}

async function buildBrowserTarget(target: TargetConfig) {
  const buildDir = resolve('build/browser');

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

  let bundle;

  try {
    bundle = await rollup({
      ...createRollupConfig('browser'),
      plugins: [...createRollupPlugins(buildDir, target.defaultLevel), htmlPlugin()],
      onwarn() {}
    });

    await buildEngineWorkers('browser', target);

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

  let mainBundle;
  let sandboxBundle;

  try {
    mainBundle = await rollup({
      ...createRollupConfig('electron-main', {
        input: {
          main: getLauncherPath('electron-main')
        },
        plugins: createRollupPlugins(buildDir, target.defaultLevel),
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
          ...createRollupPlugins(buildDir, target.defaultLevel),
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

    await mainBundle.write({ ...outputOptions, format: 'cjs' });
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

  let bundle;

  try {
    bundle = await rollup({
      ...createRollupConfig('node'),
      plugins: [
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

async function buildTarget(config: TargetConfig) {
  if (config.platform === 'browser') {
    await buildBrowserTarget(config);
  }
  if (config.platform === 'electron') {
    await buildElectronTarget(config);
  }
  if (config.platform === 'node') {
    await buildNodeTarget(config);
  }
}

let server: Server;

async function serveBrowserTarget(target: TargetConfig) {
  const buildDir = resolve(APEX_DIR, 'build/browser');

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

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
        console.log(error);
      }
    });
  });

  closeServerOnTermination();

  await buildEngineWorkers('browser', target);

  const watcher = watch({
    ...createRollupConfig('browser', {
      output: {
        dir: buildDir
      },
      plugins: [
        ...createRollupPlugins(buildDir, target.defaultLevel),
        htmlPlugin(
          './index.js',
          {},
          `
<script type="module">
  const ws = new WebSocket('ws://localhost:24678')

  ws.addEventListener('open', () => {
    console.log('connection open')
    ws.send('message from client')
  })

  ws.addEventListener('message', async ({data}) => {
    let parsed

    try {
      parsed = JSON.parse(String(data))
    } catch {}

    if (parsed && parsed.type === 'update') {
      window.location.reload()
    }
  })
</script>
        `
        )
      ],
      onwarn() {}
    })
  });

  server.listen(3000, 'localhost', () => {
    log('Local: http://localhost:3000');
  });

  watcher.on('event', async event => {
    log('[browser:watcher]', event.code);

    if (event.code === 'BUNDLE_END') {
      wss.clients.forEach(socket => {
        socket.send(JSON.stringify({ type: 'update' }));
      });
    }
  });

  watcher.on('change', file => {
    log('[browser:watcher]', 'File changed');
    debug(file);
  });

  watcher.on('restart', () => {});

  watcher.on('close', () => {});
}

async function serveElectronTarget(target: TargetConfig) {
  const buildDir = resolve(APEX_DIR, 'build/electron');

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

  await buildEngineWorkers('electron', target);

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
      plugins: createRollupPlugins(buildDir, target.defaultLevel),
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
      plugins: [...createRollupPlugins(buildDir, target.defaultLevel), htmlPlugin('./sandbox.js')],
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
  return {
    input: {
      index: getLauncherPath(launcher),
      ...Object.fromEntries(
        glob
          .sync('src/engine/**/*.ts')
          .map(file => [
            relative('src/engine', file.slice(0, file.length - extname(file).length)),
            fileURLToPath(pathToFileURL(resolve(file)))
          ])
      ),
      ...getGameMaps()
    },
    output: {
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline',
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

function createRollupPlugins(buildDir: string, defaultLevel: string): Plugin[] {
  return [
    replace({
      preventAssignment: true,
      values: {
        DEFAULT_LEVEL: JSON.stringify(defaultLevel),
        IS_DEV: 'true'
      }
    }),
    nodeResolve({ preferBuiltins: true }),
    typescript({ outDir: buildDir })
  ];
}

async function loadConfigFromBundledFile(root: string, bundledCode: string): Promise<ApexConfig> {
  const fileNameTmp = resolve(root, `${CONFIG_FILE_NAME}.${Date.now()}.mjs`);

  writeFileSync(fileNameTmp, bundledCode);

  const fileUrl = pathToFileURL(fileNameTmp);

  try {
    return (await dynamicImport(fileUrl)).default;
  } finally {
    try {
      unlinkSync(fileNameTmp);
    } catch {}
  }
}

async function buildEngineWorkers(platform: Platform, target: TargetConfig) {
  const baseDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
  const buildDir = resolve(APEX_DIR, `build/${platform}/workers`);
  const input = getAllWorkerFiles(baseDir, []).filter(
    val => val.includes('platform') && (val.includes(platform) || val.includes('common'))
  );

  let bundle: RollupBuild | undefined;

  if (!input.length) {
    return;
  }

  try {
    bundle = await rollup({
      input,
      preserveEntrySignatures: false,
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
          }
        }),
        nodeResolve({ preferBuiltins: true }),
        typescript({ outDir: buildDir })
      ],
      onwarn() {}
    });

    await bundle.write({
      dir: buildDir,
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false
      //entryFileNames: '[name]-[hash].js'
    });
  } catch (error) {
    debug(error);
  }

  if (bundle) {
    await bundle.close();
  }
}

function getAllWorkerFiles(path: string, files: string[] = []): string[] {
  const dir = readdirSync(path);

  for (const fileOrDir of dir) {
    const fullPath = join(path, fileOrDir);
    const isDir = lstatSync(fullPath).isDirectory();

    if (isDir) {
      getAllWorkerFiles(fullPath, files);
    }

    if (fullPath.endsWith('.worker.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}
