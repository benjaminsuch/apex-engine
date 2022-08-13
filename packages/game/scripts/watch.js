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
        console.error('watch build failed:', error);
      } else {
        console.log('watching...');
        //await buildTypes();
      }
    }
  }
})
  .then(async () => {
    console.log('watching...');
    //await buildTypes();
  })
  .catch(() => process.exit(1));

async function buildTypes() {
  try {
    await execa('yarn', ['build-types']);
  } catch (error) {
    console.log(error);
  }
}
