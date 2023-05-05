import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'rollup';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)).toString());

export default defineConfig([
  {
    input: {
      abt: 'src/abt/cli.ts'
    },
    output: {
      dir: 'dist',
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false,
      sourcemap: 'inline'
    },
    external: [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      typescript({ tsconfig: './tsconfig.abt.json' }),
      commonjs(),
      json()
    ],
    onwarn(warning, warn) {
      if (warning.message.includes('Circular dependency')) {
        return;
      }
      warn(warning);
    }
  }
]);
