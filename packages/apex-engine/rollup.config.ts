import { readFileSync } from 'node:fs';

import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)).toString());

export default defineConfig([
  {
    input: {
      abt: 'src/abt/cli.ts',
    },
    output: {
      dir: 'bin',
      exports: 'named',
      format: 'esm',
      banner: '#!/usr/bin/env node',
    },
    external: [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({ tsconfig: 'tsconfig.cli.json', exclude: ['node_modules', 'rollup.config.ts'] }),
      json(),
    ],
    onwarn(warning, warn): void {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    },
  },
]);
