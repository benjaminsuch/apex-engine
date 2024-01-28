import { createRequire } from 'node:module';
import { basename, dirname, extname, isAbsolute, join, posix, sep } from 'node:path';

import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs-extra';
import { type EmittedAsset, type InputPluginOption, type OutputChunk, rollup, type RollupBuild } from 'rollup';

import { APEX_DIR, type TargetConfig } from '../config';
import { replace } from '.';

const _require = createRequire(import.meta.url);

export interface WorkersPluginOptions {
  inline?: boolean;
  isBuild?: boolean;
  target: TargetConfig;
}

export interface WorkerCacheEntry {
  id: string;
  target: string;
  outputPath: null | string;
  chunk: null | OutputChunk;
}

export function workerPlugin({
  inline,
  isBuild = false,
  target,
}: WorkersPluginOptions): InputPluginOption {
  const cache = new Map<string, WorkerCacheEntry>();
  const assets = new Map<string, EmittedAsset>();

  return {
    name: 'workers',
    resolveId(id, importer) {
      const match = id.match(/(.+)\?worker/);
      let target: string | null = null;

      if (match) {
        const [, fileName] = match;

        if (!cache.has(fileName)) {
          if (importer) {
            const folder = dirname(importer);
            const paths = _require.resolve.paths(importer);

            if (paths) {
              paths.push(folder);
            }

            target = _require.resolve(join(folder, `${fileName}.ts`), {
              paths: ['.ts'],
            });
          } else if (isAbsolute(fileName)) {
            target = fileName;
          }

          if (target) {
            const extension = extname(target);
            const workerName = basename(target, extension);

            cache.set(target, {
              id: `${workerName}.js`,
              target,
              outputPath: null,
              chunk: null,
            });

            return target;
          }
        }
      }

      return null;
    },
    async load(id) {
      let bundle: RollupBuild | undefined;
      const cacheEntry = cache.get(id);

      if (!cacheEntry) {
        return;
      }

      try {
        bundle = await rollup({
          input: id,
          plugins: [
            workerPlugin({ target }),
            replace(target),
            nodeResolve({ preferBuiltins: true }),
            typescript(),
          ],
          onwarn() {},
        });

        const { output } = await bundle.generate({
          format: 'esm',
          sourcemap: false,
          chunkFileNames: '[name].js',
        });

        const [chunk, ...chunks] = output.filter((chunk): chunk is OutputChunk => chunk.type === 'chunk');

        chunks.forEach((chunk) => {
          assets.set(chunk.fileName, {
            fileName: chunk.fileName,
            source: chunk.code,
            type: 'asset',
          });
        });

        // TODO: To support HMR we can add all the files in `chunk.modules` to a watch-list.
        chunk.fileName = posix.join('worker', cacheEntry.id);
        cacheEntry.chunk = chunk;

        return {
          code: chunk.code,
          map: { mappings: '' },
        };
      } catch (error) {
        console.error(error);
      }

      if (bundle) {
        await bundle.close();
      }

      return {};
    },
    transform(code, id) {
      const entry = cache.get(id);

      if (entry?.chunk) {
        let code = [
          `export default function WorkerFactory() {`,
          `  return new Worker("${entry.chunk.fileName}", { type: "module" });`,
          `};`,
        ];

        if (target.platform === 'browser') {
          if (inline) {
            return {
              code: `
                const encodedJs = "${Buffer.from(`//${entry.id}\n\n${code}`).toString('base64')}";
                const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
    
                export default function WorkerWrapper() {
                  let objURL;
                  try {
                    objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
                    if (!objURL) throw ''
                    return new Worker(objURL)
                  } catch(e) {
                    return new Worker("data:application/javascript;base64," + encodedJs, { type: 'module' });
                  } finally {
                    objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
                  }
                }
              `,
              map: `{ "version":3, "file": "${basename(id)}", "sources":[], "sourcesContent":[], "names":[], "mappings": "" }`,
            };
          }
        } else {
          const path = isBuild
            ? `build/${target.platform}`
            : `${APEX_DIR}/build/${target.platform}`;
          const fileName = posix.join(path, entry.chunk.fileName).split(sep).join(posix.sep);

          code = [
            `import { Worker } from "node:worker_threads"`,
            ``,
            `export default function WorkerFactory(options) {`,
            `  return new Worker("${fileName}", options);`,
            `};`,
          ];
        }

        return {
          code: code.join('\n'),
        };
      }

      return {};
    },
    renderChunk(code, chunk, options, meta) {},
    generateBundle(options, bundle) {
      // console.log('assets', assets);
      // assets.forEach((asset) => {
      //   this.emitFile(asset);
      //   assets.delete(asset.fileName!);
      // });

      for (const [id, worker] of cache) {
        if (worker.chunk) {
          bundle[worker.id] = worker.chunk;
        }
      }
    },
  } as InputPluginOption;
}
