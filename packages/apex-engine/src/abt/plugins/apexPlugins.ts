import { writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { type InputPluginOption, rollup, type RollupBuild } from 'rollup';

import { type TargetConfig } from '../config';

export function apexPlugins({ plugins }: TargetConfig, { buildDir }: any): InputPluginOption {
  const input = plugins.map(id => resolve(id));

  return {
    name: 'apex-plugins',
    async buildStart() {
      console.log('build start');
      let bundle: RollupBuild | undefined;

      try {
        bundle = await rollup({
          input,
          plugins: [
            nodeResolve({ preferBuiltins: true }),
            typescript(),
            commonjs(),
          ],
        });

        await bundle.write({
          dir: resolve(buildDir, 'plugins'),
          format: 'esm',
          exports: 'named',
          sourcemap: false,
        });

        const code = [
          'export const pluginMap = new Map()',
          '',
          ...plugins.map(id => `pluginMap.set('${id}', import('${basename(id)}'))`),
        ].join('\n');

        // writeFileSync(resolve(buildDir, 'plugins/index.js'), code, 'utf-8');
      } catch (error) {
        console.log(error);
      }

      if (bundle) {
        await bundle.close();
      }
    },
  };
}
