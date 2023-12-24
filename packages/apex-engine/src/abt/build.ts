import { resolve } from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import virtual from '@rollup/plugin-virtual';
import { rollup } from 'rollup';

import { getEngineSourceFiles, getLauncherPath, type TargetConfig } from './config';

export async function buildBrowserTarget(target: TargetConfig) {
  const bundle = await rollup({
    input: {
      index: getLauncherPath('browser'),
      ...getEngineSourceFiles(),
    },
    plugins: [
      virtual({
        'build:info': [
          'export const plugins = new Map()',
          '',
          ...target.plugins.map(id => `plugins.set('${id}', await import('${id}'))`),
        ].join('\n'),
      }),
      nodeResolve({ preferBuiltins: true }),
      typescript(),
    ],
    onwarn() {},
  });

  await bundle.write({
    dir: resolve('build/browser'),
    exports: 'named',
    format: 'esm',
    sourcemap: false,
  });

  await bundle.close();
}
