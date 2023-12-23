import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { rollup } from 'rollup';

import { type TargetConfig } from './config';

export async function buildPluginsFile(dir: string, plugins: TargetConfig['plugins']) {
  const buildDir = resolve(dir, 'plugins');
  const bundle = await rollup({
    input: plugins.map(id => resolve(id)),
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript(),
      commonjs(),
    ],
  });

  await bundle.write({
    dir: buildDir,
    exports: 'named',
    format: 'esm',
    sourcemap: false,
  });

  await bundle.close();

  const code = [
    'export const pluginMap = new Map()',
    '',
    ...plugins.map(id => `pluginMap.set('${id}', import('${id}'))`),
    'console.log("plugins:", pluginMap)',
  ].join('\n');

  writeFileSync(resolve(buildDir, 'index.js'), code, 'utf-8');
}
