import { resolve } from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { rollup } from 'rollup';

import { getEngineSourceFiles, getLauncherPath, type TargetConfig } from './config';
import { buildPluginsFile } from './plugins';

export async function buildBrowserTarget(target: TargetConfig) {
  const buildDir = resolve('build/browser');

  await buildPluginsFile(buildDir, target.plugins);

  const bundle = await rollup({
    input: {
      index: getLauncherPath('browser'),
      ...getEngineSourceFiles(),
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript(),
    ],
    onwarn() {},
  });

  await bundle.write({
    dir: buildDir,
    exports: 'named',
    format: 'esm',
    sourcemap: false,
  });

  await bundle.close();
}
