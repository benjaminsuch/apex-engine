import { resolve } from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { watch } from 'rollup';
import { WebSocketServer } from 'ws';

import { APEX_DIR, getEngineSourceFiles, getLauncherPath, type TargetConfig } from './config';
import { apexPlugins } from './plugins';
import { closeServerOnTermination } from './server';

export async function serveBrowserTarget(target: TargetConfig) {
  const buildDir = resolve(APEX_DIR, 'build/browser');
  const wss = new WebSocketServer({ host: 'localhost', port: 24678 });

  wss.on('connection', (ws) => {
    ws.on('error', console.error);
  });

  closeServerOnTermination(wss);

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
      nodeResolve({ preferBuiltins: true }),
      typescript(),
      apexPlugins(target, { buildDir }),
    ],
  });

  watcher.on('event', async (event) => {
    console.log(`[${new Date().toLocaleTimeString()}] [browser:watcher]`, event.code);
  });
}
