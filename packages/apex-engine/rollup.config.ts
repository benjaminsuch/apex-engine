import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

export default defineConfig({
  input: {
    'engine/index': 'src/engine/index.ts',
    'engine/components/index': 'src/engine/components/index.ts',
    'launch/index': 'src/launch/index.ts',
    'renderer/index': 'src/renderer/index.ts',
    'three/index': 'src/three/index.ts'
  },
  output: {
    dir: 'build',
    format: 'esm'
  },
  plugins: [nodeResolve(), typescript()]
});
