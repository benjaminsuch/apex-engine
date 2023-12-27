import { resolve } from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
// import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs-extra';
import { rollup } from 'rollup';

import { getEngineSourceFiles, getLauncherPath, type TargetConfig } from './config';
import { buildInfo, replace, workerPlugin } from './plugins';

export async function buildBrowserTarget(target: TargetConfig): Promise<void> {
  const buildDir = resolve('build/browser');

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

  const bundle = await rollup({
    input: {
      index: getLauncherPath('browser'),
      ...getEngineSourceFiles(),
    },
    plugins: [
      replace(target),
      buildInfo(target),
      workerPlugin({ isBuild: true, target }),
      nodeResolve({ preferBuiltins: true }),
      typescript(),
      // terser({ keep_classnames: true, module: true }),
    ],
  });

  await bundle.write({
    dir: buildDir,
    exports: 'named',
    format: 'esm',
    sourcemap: false,
  });

  await bundle.close();
}
