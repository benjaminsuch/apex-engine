#!/usr/bin/env node
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { cac } from 'cac';
import glob from 'glob';
import fs from 'fs-extra';
import mime from 'mime';
import { writeFileSync, unlinkSync, existsSync, readFileSync, mkdirSync, readFile } from 'node:fs';
import { createServer } from 'node:http';
import { resolve, dirname, join, isAbsolute, extname, basename, posix, sep, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rimraf } from 'rimraf';
import { rollup, watch } from 'rollup';
import { WebSocketServer } from 'ws';
import { builtinModules, createRequire } from 'node:module';
import { spawn } from 'node:child_process';
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

var NetDriver;
(function (NetDriver) {
    NetDriver["WebSocket"] = "WebSocketNetDriver";
    NetDriver["WebRTC"] = "WebRTCNetDriver";
})(NetDriver || (NetDriver = {}));
const defaultTargetConfig = {
    defaultLevel: './maps/index.js',
    platform: 'browser',
    net: {
        netDriver: NetDriver.WebSocket
    },
    target: 'game'
};
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

const _require$1 = createRequire(import.meta.url);
function getElectronPath() {
    let electronExecPath = process.env.ELECTRON_EXEC_PATH ?? '';
    if (!electronExecPath) {
        const electronPath = dirname(_require$1.resolve('electron'));
        const pathFile = join(electronPath, 'path.txt');
        if (existsSync(pathFile)) {
            const execPath = readFileSync(pathFile, 'utf-8');
            electronExecPath = join(electronPath, 'dist', execPath);
            process.env.ELECTRON_EXEC_PATH = electronExecPath;
        }
    }
    return electronExecPath;
}
function startElectron(path = './build/electron/main.js') {
    const ps = spawn(getElectronPath(), [path]);
    ps.stdout.on('data', chunk => {
        console.log(chunk.toString());
    });
    ps.stderr.on('data', chunk => {
        console.log(chunk.toString());
    });
    return ps;
}

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
function workersPlugin({ inline, isBuild = false, target }) {
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
                let code = [
                    `export default function WorkerFactory() {`,
                    `  return new Worker("${entry.chunk.fileName}", { type: "module" });`,
                    `};`
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
                            map: `{"version":3,"file":"${basename(id)}","sources":[],"sourcesContent":[],"names":[],"mappings":""}`
                        };
                    }
                }
                else {
                    const path = isBuild
                        ? `build/${target.platform}`
                        : `${APEX_DIR}/build/${target.platform}`;
                    const fileName = posix.join(path, entry.chunk.fileName).split(sep).join(posix.sep);
                    code = [
                        `import { Worker } from "node:worker_threads"`,
                        ``,
                        `export default function WorkerFactory(options) {`,
                        `  return new Worker("${fileName}", options);`,
                        `};`
                    ];
                }
                return {
                    code: code.join('\n')
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

const { log } = console;
let isDebugModeOn = false;
const debug = (...args) => isDebugModeOn && console.debug('DEBUG', ...args);
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
    for (let targetConfig of targets) {
        targetConfig = { ...defaultTargetConfig, ...targetConfig };
        if (platform && targetConfig.platform !== platform) {
            continue;
        }
        if (targetConfig.platform === 'browser') {
            await serveBrowserTarget(targetConfig);
        }
        if (targetConfig.platform === 'electron') {
            await serveElectronTarget(targetConfig);
        }
        if (targetConfig.platform === 'node') {
            await serveNodeTarget(targetConfig);
        }
    }
});
cli.command('build').action(async (options) => {
    filterDuplicateOptions(options);
    const { config: configFile, debug, platform } = options;
    const { targets } = await getApexConfig(configFile);
    if (debug) {
        isDebugModeOn = true;
    }
    for (let targetConfig of targets) {
        targetConfig = { ...defaultTargetConfig, ...targetConfig };
        if (platform && targetConfig.platform !== platform) {
            continue;
        }
        if (targetConfig.platform === 'browser') {
            await buildBrowserTarget(targetConfig);
        }
        if (targetConfig.platform === 'electron') {
            await buildElectronTarget(targetConfig);
        }
        if (targetConfig.platform === 'node') {
            await buildNodeTarget(targetConfig);
        }
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
            plugins: [workersPlugin({ target }), ...createRollupPlugins(buildDir, target), htmlPlugin()],
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
    process.env['ELECTRON_RENDERER_URL'] = join(process.cwd(), 'build/electron/index.html');
    try {
        mainBundle = await rollup({
            ...createRollupConfig('electron-main', {
                input: {
                    main: getLauncherPath('electron-main')
                },
                plugins: [workersPlugin({ target }), ...createRollupPlugins(buildDir, target)],
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
                    // electron-sandbox is a browser, so we change the platform to "browser".
                    workersPlugin({ target: { ...target, platform: 'browser' } }),
                    ...createRollupPlugins(buildDir, { ...target, platform: 'browser' }),
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
                workersPlugin({ target }),
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
let server;
async function serveBrowserTarget(target) {
    const buildDir = resolve(APEX_DIR, 'build/browser');
    const wss = new WebSocketServer({ host: 'localhost', port: 24678 });
    if (existsSync(buildDir)) {
        await rimraf(buildDir);
    }
    fs.copy('src/assets', resolve(buildDir, 'assets'), err => {
        if (err) {
            console.error('Error copying folder:', err);
        }
    });
    wss.on('connection', ws => {
        ws.on('error', console.error);
    });
    server = createServer((req, res) => {
        const unsafePath = decodeURI((req.url ?? '').split('?')[0]);
        const urlPath = posix.normalize(unsafePath);
        readFileFromContentBase(buildDir, urlPath, (error, content, filePath) => {
            if (!error) {
                res.writeHead(200, {
                    'Content-Type': mime.getType(filePath) ?? 'text/plain',
                    'Cross-Origin-Opener-Policy': 'same-origin',
                    'Cross-Origin-Embedder-Policy': 'require-corp'
                });
                res.end(content, 'utf-8');
            }
            else {
                if (filePath.includes('favicon')) {
                    return;
                }
                console.log(error);
            }
        });
    });
    closeServerOnTermination();
    const watcher = watch({
        ...createRollupConfig('browser', {
            output: {
                dir: buildDir
            },
            plugins: [
                workersPlugin({ target }),
                ...createRollupPlugins(buildDir, target),
                htmlPlugin('./index.js', {}, [
                    `<script type="module">`,
                    `  const ws = new WebSocket('ws://localhost:24678')`,
                    ``,
                    `  ws.addEventListener('message', async ({data}) => {`,
                    ``,
                    `    let parsed`,
                    ``,
                    `    try {`,
                    `      parsed = JSON.parse(String(data))`,
                    `    } catch {}`,
                    ``,
                    `    if (parsed && parsed.type === 'update') {`,
                    `      window.location.reload()`,
                    `    }`,
                    `  })`,
                    `</script>`
                ].join('\n'))
            ],
            onwarn() { }
        })
    });
    watcher.on('event', async (event) => {
        log(`[${new Date().toLocaleTimeString()}] [browser:watcher]`, event.code);
        if (event.code === 'END') {
            if (!server.listening) {
                server.listen(3000, 'localhost', () => {
                    log('\nLocal: http://localhost:3000');
                });
            }
        }
        if (event.code === 'BUNDLE_END') {
            wss.clients.forEach(socket => {
                socket.send(JSON.stringify({ type: 'update' }));
            });
            event.result.close();
        }
        if (event.code === 'ERROR') {
            console.log(event);
        }
    });
    watcher.on('change', file => {
        log(`\n[${new Date().toLocaleTimeString()}] [browser:watcher]`, 'File changed');
        debug(file);
    });
    watcher.on('restart', () => { });
    watcher.on('close', () => { });
    watcher.close();
}
async function serveElectronTarget(target) {
    const buildDir = resolve(APEX_DIR, 'build/electron');
    if (existsSync(buildDir)) {
        await rimraf(buildDir);
    }
    process.env['ELECTRON_RENDERER_URL'] = join(process.cwd(), '.apex/build/electron/index.html');
    const watcherMain = watch({
        ...createRollupConfig('electron-main', {
            input: {
                main: getLauncherPath('electron-main')
            },
            output: {
                dir: buildDir,
                format: 'cjs',
                sourcemap: false
            },
            plugins: createRollupPlugins(buildDir, target),
            external: ['electron'],
            onwarn() { }
        })
    });
    watcherMain.on('event', event => {
        log('[electron-main:watcher]', event.code);
        if (event.code === 'ERROR') {
            console.log(event.error);
        }
    });
    watcherMain.on('change', file => {
        log('[electron-main:watcher]', 'File changed');
        debug(file);
    });
    watcherMain.on('restart', () => { });
    watcherMain.on('close', () => { });
    const watcherSandbox = watch({
        ...createRollupConfig('electron-sandbox', {
            input: {
                sandbox: getLauncherPath('electron-sandbox'),
                ...getGameMaps()
            },
            output: {
                dir: buildDir
            },
            plugins: [
                // electron-sandbox is a browser, so we change the platform to "browser".
                workersPlugin({ target: { ...target, platform: 'browser' } }),
                ...createRollupPlugins(buildDir, { ...target, platform: 'browser' }),
                htmlPlugin('./sandbox.js')
            ],
            onwarn() { }
        })
    });
    let isRunning = false;
    watcherSandbox.on('event', event => {
        log('[electron-sandbox:watcher]', event.code);
        if (event.code === 'BUNDLE_END') ;
        if (event.code === 'END' && !isRunning) {
            startElectron(buildDir + '/main.js');
            isRunning = true;
        }
    });
    watcherSandbox.on('change', file => {
        log('[electron-sandbox:watcher]', 'File changed');
        debug(file);
    });
    watcherSandbox.on('restart', () => { });
    watcherSandbox.on('close', () => { });
}
async function serveNodeTarget(target) {
    const buildDir = resolve(APEX_DIR, 'build/node');
    if (existsSync(buildDir)) {
        await rimraf(buildDir);
    }
    const watcher = watch({
        ...createRollupConfig('node', {
            output: {
                dir: buildDir,
                chunkFileNames: '[name]-[hash].mjs',
                entryFileNames: `[name].mjs`,
                externalLiveBindings: false,
                format: 'esm',
                freeze: false,
                sourcemap: false
            },
            plugins: [workersPlugin({ target }), ...createRollupPlugins(buildDir, target)],
            onwarn() { }
        })
    });
    watcher.on('event', async (event) => {
        log('[node:watcher]', event.code);
        if (event.code === 'ERROR') {
            console.log(event);
        }
        if (event.code === 'BUNDLE_END') {
            event.result.close();
        }
    });
    watcher.close();
}
function readFileFromContentBase(contentBase, urlPath, callback) {
    let filePath = resolve(contentBase, '.' + urlPath);
    if (urlPath.endsWith('/')) {
        filePath = resolve(filePath, 'index.html');
    }
    debug('reading file:', filePath);
    readFile(filePath, (error, content) => {
        callback(error, content, filePath);
    });
}
function closeServerOnTermination() {
    const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];
    terminationSignals.forEach(signal => {
        process.on(signal, () => {
            debug('process signal:', signal);
            if (server) {
                debug('closing server...');
                server.close();
                process.exit();
            }
        });
    });
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
            chunkFileNames: '[name].js',
            manualChunks: {
                vendor: ['three']
            },
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
function createRollupPlugins(buildDir, { defaultLevel, platform, renderer, target }) {
    return [
        replace({
            preventAssignment: true,
            values: {
                DEFAULT_LEVEL: JSON.stringify(defaultLevel),
                IS_DEV: 'true',
                IS_CLIENT: String(target === 'client'),
                IS_GAME: String(target === 'game'),
                IS_SERVER: String(target === 'server'),
                IS_BROWSER: String(platform === 'browser'),
                RENDER_ON_MAIN_THREAD: String(renderer?.runOnMainThread ?? false)
            }
        }),
        nodeResolve({ preferBuiltins: true }),
        typescript({ outDir: buildDir }),
        commonjs()
    ];
}
