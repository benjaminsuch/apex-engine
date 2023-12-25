import { createServer, type Server } from 'node:http';
import { posix, resolve } from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import virtual from '@rollup/plugin-virtual';
import mime from 'mime';
import { watch } from 'rollup';
import { WebSocketServer } from 'ws';

import { APEX_DIR, getEngineSourceFiles, getLauncherPath, type TargetConfig } from './config';
import { readFileFromContentBase } from './file';
import { htmlPlugin, workerPlugin } from './plugins';
import { closeServerOnTermination } from './server';

let server: Server;

export async function serveBrowserTarget(target: TargetConfig) {
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
      virtual({
        'build:info': [
          'export const plugins = new Map()',
          '',
          ...target.plugins.map(id => `plugins.set('${id}', await import('${id}'))`),
        ].join('\n'),
      }),
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
    ],
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
