import { createServer, type Server } from 'node:http';
import { extname, join, posix, resolve } from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
// import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs-extra';
import mime from 'mime';
import { watch } from 'rollup';
import { WebSocketServer } from 'ws';

import { APEX_DIR, getEngineSourceFiles, getGameMaps, getGameSourceFiles, getLauncherPath, type TargetConfig } from './config';
import { startElectron } from './electron';
import { readFileFromContentBase } from './file';
import { buildInfo, htmlPlugin, replace, workerPlugin } from './plugins';
import { closeServerOnTermination } from './server';

let server: Server;
const levels = Object.entries(getGameMaps());

export async function serveBrowserTarget(target: TargetConfig): Promise<void> {
  const buildDir = resolve(APEX_DIR, 'build/browser');
  const wss = new WebSocketServer({ host: 'localhost', port: 24678 });

  wss.on('connection', (ws) => {
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
          'Cross-Origin-Embedder-Policy': 'require-corp',
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

  closeServerOnTermination(server);

  fs.copy('src/assets', resolve(buildDir, 'assets'), (err: any) => {
    if (err) {
      console.error('Error copying folder:', err);
    }
  });

  copyGameMaps(buildDir);

  const engineFiles = getEngineSourceFiles();
  const gameFiles = getGameSourceFiles();

  const watcher = watch({
    input: {
      index: getLauncherPath('browser'),
      ...engineFiles,
      ...gameFiles,
    },
    output: {
      dir: buildDir,
      exports: 'named',
      format: 'esm',
      chunkFileNames: '[name].js',
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('three')) {
            return 'vendors/three';
          }
          if (id.includes('rapier3d-compat')) {
            return 'vendors/rapier';
          }
          return 'vendors/index';
        }
        if (Object.keys(gameFiles).includes(id)) {
          return id;
        }
        return undefined;
      },
    },
    plugins: [
      replace(target),
      buildInfo(target, levels),
      workerPlugin({ target }),
      nodeResolve({ preferBuiltins: true }),
      typescript(),
      htmlPlugin(
        './index.js',
        {},
        [
          `<script type="module">`,
          `  const ws = new WebSocket('ws://localhost:24678')`,
          ``,
          `  ws.addEventListener('message', async ({ data }) => {`,
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
          `</script>`,
        ].join('\n')
      ),
      // terser({ keep_classnames: true, module: true }),
    ],
    watch: {
      buildDelay: 250,
    },
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    },
  });

  watcher.on('event', async (event) => {
    console.log(`[${new Date().toLocaleTimeString()}] [browser:watcher]`, event.code);

    if (event.code === 'END') {
      if (!server.listening) {
        server.listen(3000, 'localhost', () => {
          console.log('\nLocal: http://localhost:3000');
        });
      }
    }

    if (event.code === 'BUNDLE_END') {
      wss.clients.forEach((socket) => {
        socket.send(JSON.stringify({ type: 'update' }));
      });

      event.result.close();
    }

    if (event.code === 'ERROR') {
      console.log(event);
    }
  });

  watcher.close();
}

export async function serveElectronTarget(target: TargetConfig): Promise<void> {
  const buildDir = resolve(APEX_DIR, 'build/electron');
  const engineFiles = getEngineSourceFiles();
  const gameFiles = getGameSourceFiles();

  process.env['ELECTRON_RENDERER_URL'] = join(process.cwd(), '.apex/build/electron/index.html');

  fs.copy('src/assets', resolve(buildDir, 'assets'), (err: any) => {
    if (err) {
      console.error('Error copying folder:', err);
    }
  });

  copyGameMaps(buildDir);

  const main = watch({
    input: {
      main: getLauncherPath('electron-main'),
    },
    output: {
      dir: buildDir,
      format: 'cjs',
      sourcemap: false,
      chunkFileNames: '[name].js',
    },
    plugins: [
      replace(target),
      buildInfo(target, levels),
      workerPlugin({ target }),
      nodeResolve({ preferBuiltins: true }),
      typescript(),
    ],
    external: ['electron'],
    watch: {
      buildDelay: 250,
    },
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    },
  });

  main.on('event', (event) => {
    console.log(`[${new Date().toLocaleTimeString()}] [electron-main:watcher]`, event.code);

    if (event.code === 'ERROR') {
      console.log(event.error);
    }
  });

  // Set platform to browser for electron-sandbox
  target = { ...target, platform: 'browser' };

  const sandbox = watch({
    input: {
      sandbox: getLauncherPath('electron-sandbox'),
      ...engineFiles,
      ...gameFiles,
    },
    output: {
      dir: buildDir,
      exports: 'named',
      format: 'esm',
      chunkFileNames: '[name].js',
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('three')) {
            return 'vendors/three';
          }
          if (id.includes('rapier3d-compat')) {
            return 'vendors/rapier';
          }
          return 'vendors/index';
        }
        if (Object.keys(gameFiles).includes(id)) {
          return id;
        }
        return undefined;
      },
    },
    plugins: [
      replace(target),
      buildInfo(target, levels),
      workerPlugin({ target }),
      nodeResolve({ preferBuiltins: true }),
      typescript(),
      htmlPlugin(
        './sandbox.js',
        {
          meta: [
            { charset: 'utf-8' },
            { 'http-equiv': 'Content-Security-Policy', 'content': 'default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'' },
          ],
        }
      ),
    ],
    watch: {
      buildDelay: 250,
    },
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    },
  });

  let isRunning = false;

  sandbox.on('event', (event) => {
    console.log(`[${new Date().toLocaleTimeString()}] [electron-sandbox:watcher]`, event.code);

    if (event.code === 'BUNDLE_END') {
      // send message to electron-main to reload (via MessageChannel)
    }
    if (event.code === 'END' && !isRunning) {
      startElectron(buildDir + '/main.js');
      isRunning = true;
    }
    if (event.code === 'ERROR') {
      console.log(event.error);
    }
  });

  main.close();
  sandbox.close();
}

export async function serveNodeTarget(target: TargetConfig): Promise<void> {
  const buildDir = resolve(APEX_DIR, 'build/node');
  const engineFiles = getEngineSourceFiles();
  const gameFiles = getGameSourceFiles();

  copyGameMaps(buildDir);

  const watcher = watch({
    input: {
      index: getLauncherPath('node'),
      ...engineFiles,
      ...gameFiles,
    },
    output: {
      dir: buildDir,
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name].mjs',
      format: 'esm',
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('three')) {
            return 'vendors/three';
          }
          if (id.includes('rapier3d-compat')) {
            return 'vendors/rapier';
          }
          return 'vendors/index';
        }
        if (Object.keys(gameFiles).includes(id)) {
          return id;
        }
        return undefined;
      },
    },
    plugins: [
      replace(target),
      buildInfo(target, levels),
      workerPlugin({ target, format: 'cjs' }),
      nodeResolve({ preferBuiltins: true }),
      typescript(),
    ],
    watch: {
      buildDelay: 250,
    },
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    },
  });

  watcher.on('event', (event) => {
    console.log(`[${new Date().toLocaleTimeString()}] [node:watcher]`, event.code);

    if (event.code === 'ERROR') {
      console.log(event.error);
    }
  });

  watcher.close();
}

function copyGameMaps(buildDir: string): void {
  Object.entries(getGameMaps()).forEach(([p1, p2]) => {
    fs.copySync(p2, `${resolve(buildDir, p1)}${extname(p2)}`);
  });
}
