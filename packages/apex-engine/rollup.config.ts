import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, RollupOptions } from 'rollup';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)).toString());
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default (args: any): RollupOptions => {
  const isDev = args.watch;
  const isProduction = !isDev;

  return defineConfig({
    input: {
      abt: resolve(__dirname, 'src/abt/cli.ts')
    },
    output: {
      dir: resolve(__dirname, 'dist'),
      exports: 'named',
      format: 'esm',
      externalLiveBindings: false,
      freeze: false
    },
    external: [
      ...Object.keys(pkg.dependencies),
      ...(isProduction ? [] : Object.keys(pkg.devDependencies))
    ],
    treeshake: {
      moduleSideEffects: 'no-external',
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    },
    plugins: [
      typescript({
        tsconfig: resolve(__dirname, 'src/abt/tsconfig.json'),
        sourceMap: !isProduction
      })
    ]
  });
};
