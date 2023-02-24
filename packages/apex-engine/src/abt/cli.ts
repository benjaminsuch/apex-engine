import html, { makeHtmlAttributes } from '@rollup/plugin-html';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { cac } from 'cac';
import glob from 'glob';
import mime from 'mime';
import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFile, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer, Server } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rimraf } from 'rimraf';
import { rollup, watch } from 'rollup';
import { WebSocketServer } from 'ws';

import { ApexConfig, CONFIG_FILE_NAME, TargetConfig } from './config';

interface CLIOptions {
  config?: string;
  debug?: boolean;
  platform?: 'browser' | 'electron' | 'node';
  target?: 'client' | 'game' | 'server';
}

const apexDir = join(fileURLToPath(import.meta.url), '../../../.apex');
const _require = createRequire(import.meta.url);

const wss = new WebSocketServer({ host: 'localhost', port: 24678 });
const { log, warn } = console;

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

    if (!existsSync(apexDir)) {
      mkdirSync(apexDir);
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
});

cli.parse();

function filterDuplicateOptions<T extends object>(options: T) {
  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key as keyof T] = value[value.length - 1];
    }
  }
}

const dynamicImport = new Function('file', 'return import(file)');

async function getApexConfig() {
  let bundle;
  let buildFailed = false;
  let config;

  try {
    bundle = await rollup({
      input: resolve(process.cwd(), `${CONFIG_FILE_NAME}.ts`),
      plugins: [nodeResolve({ preferBuiltins: true }), typescript()]
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
    buildFailed = true;
    console.error(error);
  }

  if (bundle) {
    await bundle.close();
  }

  if (!config) {
    throw new Error(`No config found.`);
  }

  return config;
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

function startElectron(): ChildProcessWithoutNullStreams {
  const ps = spawn(getElectronPath(), ['./build/electron/main.js']);

  ps.stdout.on('data', chunk => {
    console.log(chunk.toString());
  });

  ps.stderr.on('data', chunk => {
    console.log(chunk.toString());
  });

  //ps.on('close', process.exit);

  return ps;
}

function getElectronPath() {
  let electronExecPath = process.env.ELECTRON_EXEC_PATH ?? '';

  if (!electronExecPath) {
    const electronPath = dirname(_require.resolve('electron'));
    const pathFile = join(electronPath, 'path.txt');

    if (existsSync(pathFile)) {
      const execPath = readFileSync(pathFile, 'utf-8');
      electronExecPath = join(electronPath, 'dist', execPath);
      process.env.ELECTRON_EXEC_PATH = electronExecPath;
    }
  }

  return electronExecPath;
}

async function buildBrowserTarget(target: TargetConfig) {
  let bundle;
  let buildFailed = false;

  try {
    bundle = await rollup({
      input: {
        index: getLauncherPath('browser'),
        ...getGameMaps()
      },
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
          }
        }),
        nodeResolve({ preferBuiltins: true }),
        typescript({ outDir: 'build/browser' }),
        html({
          template(options) {
            if (!options) {
              return '';
            }

            const { attributes, files, meta, publicPath, title } = options;

            const links = (files.css || [])
              .map(({ fileName }) => {
                const attrs = makeHtmlAttributes(attributes.link);
                return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
              })
              .join('\n');

            const metas = meta
              .map(input => {
                const attrs = makeHtmlAttributes(input);
                return `<meta${attrs}>`;
              })
              .join('\n');

            return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    ${metas}
    <title>${title}</title>
    ${links}
  </head>
  <body>
    <script type="module" src="./index.js"></script>
  </body>
</html>
            `;
          }
        })
      ],
      onwarn(warning, warn) {
        if (warning.message.includes('Circular dependency')) {
          return;
        }
        warn(warning);
      }
    });

    await bundle.write({
      dir: resolve('build/browser'),
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    });
  } catch (error) {
    buildFailed = true;
    console.log(error);
  }

  if (bundle) {
    await bundle.close();
  }
}

async function buildElectronTarget(target: TargetConfig) {
  let mainBundle;
  let sandboxBundle;
  let buildFailed = false;

  try {
    mainBundle = await rollup({
      input: {
        main: getLauncherPath('electron-main')
      },
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
          }
        }),
        nodeResolve({
          preferBuiltins: true
        }),
        typescript({ outDir: 'build/electron' })
      ],
      external: ['electron'],
      onwarn(warning, warn) {
        if (warning.message.includes('Circular dependency')) {
          return;
        }
        warn(warning);
      }
    });

    sandboxBundle = await rollup({
      input: {
        sandbox: getLauncherPath('electron-sandbox'),
        ...getGameMaps()
      },
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
          }
        }),
        nodeResolve(),
        typescript({ outDir: 'build/electron' }),
        html({
          meta: [
            {
              'http-equiv': 'Content-Security-Policy',
              content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
            }
          ],
          template(options) {
            if (!options) {
              return '';
            }

            const { attributes, files, meta, publicPath, title } = options;

            const links = (files.css || [])
              .map(({ fileName }) => {
                const attrs = makeHtmlAttributes(attributes.link);
                return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
              })
              .join('\n');

            const metas = meta
              .map(input => {
                const attrs = makeHtmlAttributes(input);
                return `<meta${attrs}>`;
              })
              .join('\n');

            return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    ${metas}
    <title>${title}</title>
    ${links}
  </head>
  <body>
    <script type="module" src="./sandbox.js"></script>
  </body>
</html>
            `;
          }
        })
      ],
      onwarn(warning, warn) {
        if (warning.message.includes('Circular dependency')) {
          return;
        }
        warn(warning);
      }
    });

    await mainBundle.write({
      dir: resolve('build/electron'),
      exports: 'named',
      format: 'cjs',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    });
    await sandboxBundle.write({
      dir: resolve('build/electron'),
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    });
  } catch (error) {
    buildFailed = true;
    console.log(error);
  }

  if (mainBundle) {
    await mainBundle.close();
  }
  if (sandboxBundle) {
    await sandboxBundle.close();
  }
}

async function buildNodeTarget(target: TargetConfig) {
  let bundle;
  let buildFailed = false;

  try {
    bundle = await rollup({
      input: {
        index: getLauncherPath('node'),
        ...getGameMaps()
      },
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
          }
        }),
        nodeResolve({ preferBuiltins: true }),
        typescript({ esModuleInterop: true, outDir: 'build/node' })
      ],
      onwarn(warning, warn) {
        if (warning.message.includes('Circular dependency')) {
          return;
        }
        warn(warning);
      }
    });

    await bundle.write({
      dir: resolve('build/node'),
      entryFileNames: `[name].mjs`,
      chunkFileNames: '[name]-[hash].mjs',
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    });
  } catch (error) {
    buildFailed = true;
    console.log(error);
  }

  if (bundle) {
    await bundle.close();
  }
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

function getLauncherPath(launcher: 'browser' | 'electron-main' | 'electron-sandbox' | 'node') {
  return fileURLToPath(new URL(`../src/launch/${launcher}/index.ts`, import.meta.url));
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
  const buildDir = resolve(apexDir, 'build/browser');

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

  server = createServer((req, res) => {
    const unsafePath = decodeURI((req.url ?? '').split('?')[0]);
    const urlPath = posix.normalize(unsafePath);

    readFileFromContentBase(buildDir, urlPath, (error, content, filePath) => {
      if (!error) {
        res.writeHead(200, { 'Content-Type': mime.getType(filePath) ?? 'text/plain' });
        res.end(content, 'utf-8');
      } else {
        console.log(error);
      }
    });
  });

  closeServerOnTermination();

  const watcher = watch({
    input: {
      index: getLauncherPath('browser'),
      ...getGameMaps()
    },
    output: {
      dir: buildDir,
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
        }
      }),
      nodeResolve({ preferBuiltins: true }),
      typescript({ outDir: buildDir }),
      html({
        template(options) {
          if (!options) {
            return '';
          }

          const { attributes, files, meta, publicPath, title } = options;

          const links = (files.css || [])
            .map(({ fileName }) => {
              const attrs = makeHtmlAttributes(attributes.link);
              return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
            })
            .join('\n');

          const metas = meta
            .map(input => {
              const attrs = makeHtmlAttributes(input);
              return `<meta${attrs}>`;
            })
            .join('\n');

          return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
<head>
  ${metas}
  <title>${title}</title>
  ${links}
</head>
<body>
  <script type="module" src="./index.js"></script>
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
</body>
</html>
          `;
        }
      })
    ],
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    }
  });

  server.listen(3000, 'localhost', () => {
    log('Local: http://localhost:3000');
  });

  watcher.on('event', event => {
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
  const buildDir = resolve(apexDir, 'build/electron');

  if (existsSync(buildDir)) {
    await rimraf(buildDir);
  }

  const watcherMain = watch({
    input: {
      main: getLauncherPath('electron-main')
    },
    output: {
      dir: buildDir,
      exports: 'named',
      format: 'cjs',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false
    },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
        }
      }),
      nodeResolve({
        preferBuiltins: true
      }),
      typescript({ outDir: buildDir })
    ],
    external: ['electron'],
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    }
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
    input: {
      sandbox: getLauncherPath('electron-sandbox'),
      ...getGameMaps()
    },
    output: {
      dir: buildDir,
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: false
    },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
        }
      }),
      nodeResolve(),
      typescript({ outDir: buildDir }),
      html({
        meta: [
          {
            'http-equiv': 'Content-Security-Policy',
            content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
          }
        ],
        template(options) {
          if (!options) {
            return '';
          }

          const { attributes, files, meta, publicPath, title } = options;

          const links = (files.css || [])
            .map(({ fileName }) => {
              const attrs = makeHtmlAttributes(attributes.link);
              return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
            })
            .join('\n');

          const metas = meta
            .map(input => {
              const attrs = makeHtmlAttributes(input);
              return `<meta${attrs}>`;
            })
            .join('\n');

          return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
<head>
  ${metas}
  <title>${title}</title>
  ${links}
</head>
<body>
  <script type="module" src="./sandbox.js"></script>
</body>
</html>
          `;
        }
      })
    ],
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    }
  });

  let isRunning = false;

  watcherSandbox.on('event', event => {
    log('[electron-sandbox:watcher]', event.code);

    if (event.code === 'BUNDLE_END') {
      // send message to electron-main to reload (via MessageChannel)
    }
    if (event.code === 'END' && !isRunning) {
      startElectron();
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
