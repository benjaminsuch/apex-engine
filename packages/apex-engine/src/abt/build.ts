import { resolve } from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { rollup } from 'rollup';

import { getEngineSourceFiles, getLauncherPath, type TargetConfig } from './config';
import { buildInfo, workerPlugin } from './plugins';

export async function buildBrowserTarget(target: TargetConfig): Promise<void> {
  const bundle = await rollup({
    input: {
      index: getLauncherPath('browser'),
      ...getEngineSourceFiles(),
    },
    plugins: [
      buildInfo(target),
      workerPlugin({ isBuild: true, target }),
      nodeResolve({ preferBuiltins: true }),
      typescript(),
    ],
  });

  await bundle.write({
    dir: resolve('build/browser'),
    exports: 'named',
    format: 'esm',
    sourcemap: false,
  });

  await bundle.close();
}
