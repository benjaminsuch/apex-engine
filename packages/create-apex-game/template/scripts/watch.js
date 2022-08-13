import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

import ifdef from './ifdef.mjs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const projectName = pkg.name.split('/').pop();
const define = { IS_CLIENT: true };
const buildDir = 'build';

build({
  define,
  entryPoints: ['src/index.ts'],
  outfile: `${buildDir}/${projectName}.js`,
  bundle: true,
  keepNames: true,
  plugins: [nodeExternalsPlugin(), ifdef(define, process.cwd() + '/src')],
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
  .then(() => console.log('Waiting for changes...'))
  .catch(() => process.exit(1));
