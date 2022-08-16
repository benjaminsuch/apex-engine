import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import { build, serve } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

import ifdef from './plugins/ifdef.mjs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const projectName = pkg.name.split('/').pop();
const define = { IS_CLIENT: true };
const buildDir = 'build/browser';
const clients = [];

prepareBrowserBuild()
  .then(() =>
    build({
      define,
      entryPoints: {
        [`${projectName}`]: 'src/index.ts'
      },
      format: 'esm',
      outdir: buildDir,
      bundle: true,
      keepNames: true,
      plugins: [nodeExternalsPlugin(), ifdef(define, process.cwd() + '/src')],
      sourcemap: true,
      banner: {
        js: ' (() => new EventSource("/esbuild").onmessage = () => location.reload())();'
      },
      watch: {
        async onRebuild(error) {
          if (error) {
            console.error('Build failed:', error);
          } else {
            console.log(clients.slice());
            clients.forEach(res => res.write('data: update\n\n'));
            clients.length = 0;
            console.log('Waiting for changes...');
          }
        }
      }
    })
  )
  .then(() => {
    console.log('Build complete');
    return serve(
      {
        servedir: buildDir
      },
      {
        define,
        entryPoints: {
          [`${projectName}`]: 'src/index.ts'
        },
        format: 'esm',
        outdir: buildDir,
        bundle: true,
        keepNames: true
      }
    );
  })
  .then(() => {
    createServer((req, res) => {
      const { url, method, headers } = req;

      if (req.url === '/esbuild') {
        return clients.push(
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
          })
        );
      }

      const path = ~url.split('/').pop().indexOf('.') ? url : `/index.html`; //for PWA with router

      req.pipe(
        request({ hostname: '0.0.0.0', port: 8000, path, method, headers }, prxRes => {
          res.writeHead(prxRes.statusCode, prxRes.headers);
          prxRes.pipe(res, { end: true });
        }),
        { end: true }
      );
    }).listen(3000);
  })
  .catch(error => {
    console.log(error);
    process.exit(1);
  });

async function prepareBrowserBuild() {
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
