import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';

export default defineConfig({
  input: {
    'types/engine/index': 'build/engine/index.d.ts',
    'types/engine/components/index': 'build/engine/components/index.d.ts',
    'types/launch/index': 'build/launch/index.d.ts',
    'types/renderer/index': 'build/renderer/index.d.ts'
  },
  output: {
    dir: 'build',
    format: 'esm'
  },
  plugins: [dts()]
});
