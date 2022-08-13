import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { execa } from 'execa';

import ifdef from './ifdef.mjs';

const define = { IS_CLIENT: true };

build({
  define,
  entryPoints: ['src/index.ts'],
  outdir: 'build',
  bundle: true,
  keepNames: true,
  plugins: [nodeExternalsPlugin(), ifdef(define, process.cwd() + '/src')],
  sourcemap: true,
  watch: {
    async onRebuild(error) {
      if (error) {
        console.error('Build failed:', error);
      } else {
        console.log('Waiting for changes...');
      }
    }
  }
})
  .then(async () => {
    console.log('Waiting for changes...');
  })
  .catch(() => process.exit(1));
