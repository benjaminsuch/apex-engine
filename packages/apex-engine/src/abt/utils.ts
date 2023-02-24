import html, { makeHtmlAttributes, type RollupHtmlOptions } from '@rollup/plugin-html';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';

const builtins = new Set([
  ...builtinModules,
  'assert/strict',
  'diagnostics_channel',
  'dns/promises',
  'fs/promises',
  'path/posix',
  'path/win32',
  'readline/promises',
  'stream/consumers',
  'stream/promises',
  'stream/web',
  'timers/promises',
  'util/types',
  'wasi'
]);

export function isBuiltin(id: string): boolean {
  return builtins.has(id.replace(/^node:/, ''));
}

export const dynamicImport = new Function('file', 'return import(file)');

export type Launcher = 'browser' | 'electron-main' | 'electron-sandbox' | 'node';

export function getLauncherPath(
  launcher: 'browser' | 'electron-main' | 'electron-sandbox' | 'node'
) {
  return fileURLToPath(new URL(`../src/launch/${launcher}/index.ts`, import.meta.url));
}

export function htmlPlugin(
  entryFile: string = './index.js',
  options?: RollupHtmlOptions,
  body: string = ''
) {
  return html({
    ...options,
    template(options) {
      if (!options) {
        return '';
      }

      const { attributes, files, meta, publicPath, title } = options;

      const links = (files.css || [])
        .map(({ fileName }) => {
          const attrs = makeHtmlAttributes(attributes.link);
          return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
        })
        .join('\n');

      const metas = meta
        .map(input => {
          const attrs = makeHtmlAttributes(input);
          return `<meta${attrs}>`;
        })
        .join('\n');

      return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    ${metas}
    <title>${title}</title>
    ${links}
  </head>
  <body>
    <script type="module" src="${entryFile}"></script>
    ${body}
  </body>
</html>
      `;
    }
  });
}
