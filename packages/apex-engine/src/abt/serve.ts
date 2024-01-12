import { createServer, type Server } from 'node:http';
import { extname, join, posix, relative, resolve } from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
// import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs-extra';
import mime from 'mime';
import { watch } from 'rollup';
import { WebSocketServer } from 'ws';

import { APEX_DIR, getEngineSourceFiles, getGameMaps, getLauncherPath, type TargetConfig } from './config';
import { startElectron } from './electron';
import { readFileFromContentBase } from './file';
import { buildInfo, htmlPlugin, replace, workerPlugin } from './plugins';
import { closeServerOnTermination } from './server';

let server: Server;

export async function serveBrowserTarget(target: TargetConfig): Promise<void> {
  const buildDir = resolve(APEX_DIR, 'build/browser');
  const wss = new WebSocketServer({ host: 'localhost', port: 24678 });
  const levels = Object.entries(getGameMaps());

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

  Object.entries(getGameMaps()).forEach(([p1, p2]) => {
    fs.copySync(p2, `${resolve(buildDir, 'maps', relative('game/maps', p1))}${extname(p2)}`);
  });

  const watcher = watch({
    input: {
      index: getLauncherPath('browser'),
      ...getEngineSourceFiles(),
    },
    output: {
      dir: buildDir,
      exports: 'named',
      format: 'esm',
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
          `  ws.addEventListener('message', async ({data}) => {`,
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

  process.env['ELECTRON_RENDERER_URL'] = join(process.cwd(), '.apex/build/electron/index.html');

  fs.copy('src/assets', resolve(buildDir, 'assets'), (err: any) => {
    if (err) {
      console.error('Error copying folder:', err);
    }
  });

  fs.copy('src/game/maps', resolve(buildDir, 'maps'), (err: any) => {
    if (err) {
      console.error('Error copying folder:', err);
    }
  });

  const main = watch({
    input: {
      main: getLauncherPath('electron-main'),
    },
    output: {
      dir: buildDir,
      format: 'cjs',
      sourcemap: false,
    },
    plugins: [
      replace(target),
      buildInfo(target),
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
    console.log('[electron-main:watcher]', event.code);

    if (event.code === 'ERROR') {
      console.log(event.error);
    }
  });

  main.on('change', (file) => {
    console.log('[electron-main:watcher]', 'File changed');
  });

  const sandbox = watch({
    input: {
      sandbox: getLauncherPath('electron-sandbox'),
    },
    output: {
      dir: buildDir,
    },
    plugins: [
      replace(target),
      buildInfo(target),
      workerPlugin({ target: { ...target, platform: 'browser' } }),
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
    console.log('[electron-sandbox:watcher]', event.code);

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

  sandbox.on('change', (file) => {
    console.log('[electron-sandbox:watcher]', 'File changed');
  });
}
