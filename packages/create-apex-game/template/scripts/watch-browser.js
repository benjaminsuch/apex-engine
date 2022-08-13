import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { execa } from 'execa';

import ifdef from './ifdef.mjs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const projectName = pkg.name.split('/').pop();
const define = { IS_CLIENT: true };
const buildDir = 'build/browser';

prepareBrowserBuild()
  .then(() =>
    build({
      define,
      entryPoints: {
        [`${projectName}`]: 'src/index.ts'
      },
      outdir: buildDir,
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
  )
  .then(() => {
    console.log('Serving game at localhost:3000');
  })
  .catch(error => {
    console.log(error);
    process.exit(1);
  });

async function prepareBrowserBuild() {
  const { serve } = pkg.devDependencies;

  if (!serve) {
    console.log(`Preparing browser build. Please wait...`);

    try {
      await execa('yarn', ['add', '--dev', 'serve']);
    } catch (error) {
      console.log(error);
    }

    console.log('Done.');
  }

  createIndexFile();
}

function createIndexFile() {
  const path = `${buildDir}/index.html`;

  if (!existsSync(path)) {
    writeFileSync(
      path,
      '<!DOCTYPE html>' +
        '<html lang="en">' +
        '<head>' +
        '<meta charset="UTF-8" />' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
        `<title>Apex Engine: ${projectName}</title>` +
        '</head>' +
        '<body>' +
        '<div id="root"></div>' +
        `<script type="module" src="/${projectName}.js"></script>` +
        '</body>' +
        '</html>'
    );
  }
}
