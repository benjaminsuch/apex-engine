import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const _require = createRequire(import.meta.url);

export function getElectronPath() {
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

export function startElectron(
  path: string = './build/electron/main.js'
): ChildProcessWithoutNullStreams {
  const ps = spawn(getElectronPath(), [path]);

  ps.stdout.on('data', (chunk) => {
    console.log(chunk.toString());
  });

  ps.stderr.on('data', (chunk) => {
    console.log(chunk.toString());
  });

  return ps;
}
