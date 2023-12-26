import html, { makeHtmlAttributes, type RollupHtmlOptions } from '@rollup/plugin-html';
import { type Plugin } from 'rollup';

export function htmlPlugin(
  entryFile: string = './index.js',
  options?: RollupHtmlOptions,
  body: string = ''
): Plugin<any> {
  return html({
    title: 'Apex Engine',
    ...options,
    template(options) {
      if (!options) {
        return '';
      }

      const { attributes, files, meta, publicPath, title } = options;
      const links = (files.css || [])
        .map(
          ({ fileName }) =>
            `<link href="${publicPath}${fileName}" rel="stylesheet"${makeHtmlAttributes(
              attributes.link
            )}>`
        )
        .join('\n');
      const metas = meta.map(input => `<meta${makeHtmlAttributes(input)}>`).join('\n');

      return [
        `<!doctype html>`,
        `<html${makeHtmlAttributes(attributes.html)}>`,
        `  <head>`,
        `    ${metas}`,
        `    <title>${title}</title>`,
        `    ${links}`,
        `    <style>`,
        `      body {`,
        `        margin: 0;`,
        `        overflow: hidden;`,
        `      }`,
        ``,
        `      #canvas {`,
        `        height: 100vh;`,
        `        width: 100vw;`,
        `      }`,
        `    </style>`,
        `  </head>`,
        `  <body>`,
        `    <canvas id="canvas"></canvas>`,
        `    <script type="module" src="${entryFile}"></script>`,
        `    ${body}`,
        `  </body>`,
        `</html>`,
      ].join('\n');
    },
  });
}
