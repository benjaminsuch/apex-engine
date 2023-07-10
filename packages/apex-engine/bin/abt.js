#!/usr/bin/env node
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { cac } from 'cac';
import glob from 'glob';
import 'mime';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import 'node:http';
import { resolve, dirname, join, isAbsolute, extname, basename, posix, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rimraf } from 'rimraf';
import { rollup } from 'rollup';
import { WebSocketServer } from 'ws';
import { builtinModules, createRequire } from 'node:module';
import 'node:child_process';
import html, { makeHtmlAttributes } from '@rollup/plugin-html';

new Set([
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
const dynamicImport = new Function('file', 'return import(file)');
function getLauncherPath(launcher) {
    return fileURLToPath(new URL(`../src/launch/${launcher}/index.ts`, import.meta.url));
}
function filterDuplicateOptions(options) {
    for (const [key, value] of Object.entries(options)) {
        if (Array.isArray(value)) {
            options[key] = value[value.length - 1];
        }
    }
}

const CONFIG_FILE_NAME = 'apex.config';
const APEX_DIR = resolve('.apex');
// Using defineConfig in apex.config.ts leads to an MISSING_EXPORTS error for some dependencies :shrug:
/*export function defineConfig(config: ApexConfig) {
  return config;
}*/
async function loadConfigFromBundledFile(root, bundledCode) {
    const fileNameTmp = resolve(root, `${CONFIG_FILE_NAME}.${Date.now()}.mjs`);
    writeFileSync(fileNameTmp, bundledCode);
    const fileUrl = pathToFileURL(fileNameTmp);
    try {
        return (await dynamicImport(fileUrl)).default;
    }
    finally {
        try {
            unlinkSync(fileNameTmp);
        }
        catch { }
    }
}
async function getApexConfig(configFile = resolve(`${CONFIG_FILE_NAME}.ts`)) {
    let bundle;
    let config;
    try {
        bundle = await rollup({
            input: configFile,
            plugins: [nodeResolve({ preferBuiltins: true }), typescript()],
            onwarn() { }
        });
        const result = await bundle.generate({
            exports: 'named',
            format: 'esm',
            externalLiveBindings: false,
            freeze: false,
            sourcemap: false
        });
        const [chunkOrAsset] = result.output;
        if (chunkOrAsset.type === 'chunk') {
            config = await loadConfigFromBundledFile(process.cwd(), chunkOrAsset.code);
        }
    }
    catch (error) {
        console.log(error);
        //debug(error);
    }
    if (bundle) {
        await bundle.close();
    }
    if (!config) {
        throw new Error(`No config found.`);
    }
    return config;
}

createRequire(import.meta.url);

function htmlPlugin(entryFile = './index.js', options, body = '') {
    return html({
        title: 'Apex Engine',
        ...options,
        template(options) {
            if (!options) {
                return '';
            }
            const { attributes, files, meta, publicPath, title } = options;
            const links = (files.css || [])
                .map(({ fileName }) => `<link href="${publicPath}${fileName}" rel="stylesheet"${makeHtmlAttributes(attributes.link)}>`)
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
                `</html>`
            ].join('\n');
        }
    });
}

const _require = createRequire(import.meta.url);
function workersPlugin(options = { inline: false }) {
    const cache = new Map();
    return {
        name: 'workers',
        resolveId(id, importer) {
            const match = id.match(/(.+)\?worker/);
            let target = null;
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
                            paths: ['.ts']
                        });
                    }
                    else if (isAbsolute(fileName)) {
                        target = fileName;
                    }
                    if (target) {
                        const extension = extname(target);
                        const workerName = basename(target, extension);
                        cache.set(target, {
                            id: `${workerName}.js`,
                            target,
                            outputPath: null,
                            chunk: null
                        });
                        return target;
                    }
                    return null;
                }
            }
        },
        async load(id) {
            let bundle;
            const cacheEntry = cache.get(id);
            if (!cacheEntry) {
                return;
            }
            try {
                bundle = await rollup({
                    input: id,
                    plugins: [nodeResolve({ preferBuiltins: true }), typescript()],
                    onwarn() { }
                });
                const { output } = await bundle.generate({
                    sourcemap: false
                });
                if (cacheEntry) {
                    const [chunk] = output.filter((chunk) => chunk.type === 'chunk');
                    //TODO: To support HMR we can add all the files in `chunk.modules` to a watch-list.
                    chunk.fileName = posix.join('worker', cacheEntry.id);
                    cacheEntry.chunk = chunk;
                    return {
                        code: chunk.code
                    };
                }
            }
            catch (error) {
                console.error(error);
            }
            if (bundle) {
                await bundle.close();
            }
        },
        transform(code, id) {
            const entry = cache.get(id);
            if (entry?.chunk) {
                if (options.inline) {
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
                        map: `{"version":3,"file":"${basename(id)}","sources":[],"sourcesContent":[],"names":[],"mappings":""}`
                    };
                }
                return {
                    code: [
                        `export default function WorkerFactory() {`,
                        `  return new Worker("${entry.chunk.fileName}", { type: "module" });`,
                        `};`
                    ].join('\n')
                };
            }
        },
        renderChunk(code, chunk, options, meta) { },
        generateBundle(options, bundle) {
            for (const [id, worker] of cache) {
                if (worker.chunk) {
                    bundle[worker.id] = worker.chunk;
                }
            }
        }
    };
}

const wss = new WebSocketServer({ host: 'localhost', port: 24678 });
let isDebugModeOn = false;
const debug = (...args) => isDebugModeOn && console.debug('DEBUG', ...args);
wss.on('connection', ws => {
    ws.on('error', console.error);
});
const cli = cac('apex-build-tool').version('0.1.0').help();
cli
    .option('-d, --debug', 'Shows debug messages when enabled.')
    .option('-c, --config', '[string] An optional path to the apex-config file.')
    .option('-t, --target <target>', 'client | game | server')
    .option('-p, --platform <platform>', 'browser | electron | node');
cli
    .command('serve')
    .alias('dev')
    .action(async (options) => {
    filterDuplicateOptions(options);
    const { config: configFile, debug, platform } = options;
    const { targets } = await getApexConfig(configFile);
    if (debug) {
        isDebugModeOn = true;
    }
    if (!existsSync(APEX_DIR)) {
        mkdirSync(APEX_DIR);
    }
    for (const targetConfig of targets) {
        if (platform && targetConfig.platform !== platform) {
            continue;
        }
        await buildTarget(targetConfig);
    }
});
cli.command('build').action(async (options) => {
    filterDuplicateOptions(options);
    const { config: configFile, debug, platform } = options;
    const { targets } = await getApexConfig(configFile);
    if (debug) {
        isDebugModeOn = true;
    }
    for (const targetConfig of targets) {
        if (platform && targetConfig.platform !== platform) {
            continue;
        }
        await buildTarget(targetConfig);
    }
    process.exit();
});
cli.parse();
async function buildBrowserTarget(target) {
    const buildDir = resolve('build/browser');
    if (existsSync(buildDir)) {
        await rimraf(buildDir);
    }
    let bundle;
    try {
        bundle = await rollup({
            ...createRollupConfig('browser'),
            plugins: [
                workersPlugin(),
                ...createRollupPlugins(buildDir, target.defaultLevel),
                htmlPlugin()
            ],
            onwarn() { }
        });
        await bundle.write({
            dir: buildDir,
            exports: 'named',
            format: 'esm',
            externalLiveBindings: false,
            freeze: false,
            sourcemap: 'inline'
        });
    }
    catch (error) {
        debug(error);
    }
    if (bundle) {
        await bundle.close();
    }
}
async function buildElectronTarget(target) {
    const buildDir = resolve('build/electron');
    if (existsSync(buildDir)) {
        await rimraf(buildDir);
    }
    let mainBundle;
    let sandboxBundle;
    try {
        mainBundle = await rollup({
            ...createRollupConfig('electron-main', {
                input: {
                    main: getLauncherPath('electron-main')
                },
                // Our worker plugin doesn't support nodejs workers yet
                plugins: [/*workersPlugin(),*/ ...createRollupPlugins(buildDir, target.defaultLevel)],
                external: ['electron'],
                onwarn() { }
            })
        });
        sandboxBundle = await rollup({
            ...createRollupConfig('electron-sandbox', {
                input: {
                    sandbox: getLauncherPath('electron-sandbox')
                },
                plugins: [
                    workersPlugin(),
                    ...createRollupPlugins(buildDir, target.defaultLevel),
                    htmlPlugin('./sandbox.js', {
                        meta: [
                            {
                                'http-equiv': 'Content-Security-Policy',
                                content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
                            }
                        ]
                    })
                ],
                onwarn() { }
            })
        });
        const outputOptions = {
            dir: buildDir,
            exports: 'named',
            format: 'esm',
            externalLiveBindings: false,
            freeze: false,
            sourcemap: 'inline'
        };
        await mainBundle.write({ ...outputOptions, entryFileNames: '[name].cjs', format: 'cjs' });
        await sandboxBundle.write(outputOptions);
    }
    catch (error) {
        debug(error);
    }
    if (mainBundle) {
        await mainBundle.close();
    }
    if (sandboxBundle) {
        await sandboxBundle.close();
    }
}
async function buildNodeTarget(target) {
    const buildDir = resolve('build/node');
    let bundle;
    try {
        bundle = await rollup({
            ...createRollupConfig('node'),
            plugins: [
                // Our worker plugin doesn't support nodejs workers yet
                /*workersPlugin(),*/
                replace({
                    preventAssignment: true,
                    values: {
                        DEFAULT_LEVEL: JSON.stringify(target.defaultLevel)
                    }
                }),
                nodeResolve({ preferBuiltins: true }),
                typescript({ esModuleInterop: true, outDir: buildDir })
            ],
            onwarn() { }
        });
        await bundle.write({
            dir: buildDir,
            entryFileNames: `[name].mjs`,
            chunkFileNames: '[name]-[hash].mjs',
            exports: 'named',
            format: 'esm',
            externalLiveBindings: false,
            freeze: false,
            sourcemap: 'inline'
        });
    }
    catch (error) {
        debug(error);
    }
    if (bundle) {
        await bundle.close();
    }
}
async function buildTarget(config) {
    if (config.platform === 'browser') {
        await buildBrowserTarget(config);
    }
    if (config.platform === 'electron') {
        await buildElectronTarget(config);
    }
    if (config.platform === 'node') {
        await buildNodeTarget(config);
    }
}
function getEngineSourceFiles() {
    return Object.fromEntries(glob
        .sync('src/engine/**/*.ts')
        .map(file => [
        relative('src', file.slice(0, file.length - extname(file).length)),
        fileURLToPath(pathToFileURL(resolve(file)))
    ]));
}
function getGameMaps() {
    return Object.fromEntries(glob
        .sync('src/game/maps/**/*.ts')
        .map(file => [
        relative('src/game', file.slice(0, file.length - extname(file).length)),
        fileURLToPath(pathToFileURL(resolve(file)))
    ]));
}
function createRollupConfig(launcher, { output, ...options } = {}) {
    const input = {
        index: getLauncherPath(launcher),
        ...getEngineSourceFiles(),
        ...getGameMaps()
    };
    return {
        input,
        output: {
            exports: 'named',
            format: 'esm',
            externalLiveBindings: false,
            freeze: false,
            sourcemap: 'inline',
            ...output
        },
        onwarn(warning, warn) {
            if (warning.message.includes('Circular dependency')) {
                return;
            }
            warn(warning);
        },
        ...options
    };
}
function createRollupPlugins(buildDir, defaultLevel) {
    return [
        replace({
            preventAssignment: true,
            values: {
                DEFAULT_LEVEL: JSON.stringify(defaultLevel),
                IS_DEV: 'true'
            }
        }),
        nodeResolve({ preferBuiltins: true }),
        typescript({ outDir: buildDir })
    ];
}
