#!/usr/bin/env node
import { cac } from 'cac';
import { resolve, relative, extname, dirname, join, isAbsolute, basename, posix, sep } from 'node:path';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import virtual from '@rollup/plugin-virtual';
import { rollup, watch } from 'rollup';
import { writeFileSync, unlinkSync, readFile } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import glob from 'fast-glob';
import { builtinModules, createRequire } from 'node:module';
import html, { makeHtmlAttributes } from '@rollup/plugin-html';
import { createServer } from 'node:http';
import mime from 'mime';
import { WebSocketServer } from 'ws';

var name = "apex-engine";
var description = "A cross-platform game engine written in Typescript.";
var version = "1.0.0-0";
var author = "Benjamin Such";
var license = "BSD-3-Clause";
var type = "module";
var engines = {
	node: "^20.0.0"
};
var bin = {
	abt: "bin/abt.js"
};
var files = [
	"bin",
	"src",
	"types",
	"package.json"
];
var repository = {
	type: "git",
	url: "git+https://github.com/benjaminsuch/apex-engine.git",
	directory: "packages/apex-engine"
};
var scripts = {
	"dev-cli": "yarn build-cli -w",
	"build-cli": "rollup --config rollup.config.ts --bundleConfigAsCjs"
};
var devDependencies = {
	"@types/node": "^20.10.5",
	"@types/three": "^0.159.0",
	"@types/ws": "^8.5.10",
	tslib: "^2.6.2",
	typescript: "^5.3.3"
};
var dependencies = {
	"@rollup/plugin-commonjs": "^25.0.7",
	"@rollup/plugin-html": "^1.0.3",
	"@rollup/plugin-inject": "^5.0.5",
	"@rollup/plugin-json": "^6.1.0",
	"@rollup/plugin-node-resolve": "^15.2.3",
	"@rollup/plugin-replace": "^5.0.5",
	"@rollup/plugin-swc": "^0.3.0",
	"@rollup/plugin-typescript": "^11.1.5",
	"@rollup/plugin-virtual": "^3.0.2",
	"@swc/core": "^1.3.101",
	"@types/mime": "^3.0.4",
	cac: "^6.7.14",
	"fast-glob": "^3.3.2",
	mime: "^4.0.1",
	"reflect-metadata": "^0.2.1",
	rollup: "^4.9.1",
	ws: "^8.15.1"
};
var peerDependencies = {
	electron: "^23.1.0",
	three: "^0.154.0"
};
var pkg = {
	name: name,
	description: description,
	version: version,
	author: author,
	license: license,
	type: type,
	engines: engines,
	bin: bin,
	files: files,
	repository: repository,
	scripts: scripts,
	devDependencies: devDependencies,
	dependencies: dependencies,
	peerDependencies: peerDependencies
};

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
    'wasi',
]);
const dynamicImport = new Function('file', 'return import(file)');
function filterDuplicateOptions(options) {
    for (const [key, value] of Object.entries(options)) {
        if (Array.isArray(value)) {
            options[key] = value[value.length - 1];
        }
    }
}
function measure() {
    const startTime = performance.now();
    return {
        done: (message = 'Operation done in %ss') => {
            const endTime = performance.now();
            console.log(message, ((endTime - startTime) / 1000).toFixed(2));
        },
    };
}

const CONFIG_FILE_NAME = 'apex.config';
const APEX_DIR = resolve('.apex');
let config;
async function getApexConfig(configFile = resolve(`${CONFIG_FILE_NAME}.ts`)) {
    let bundle;
    if (config) {
        return config;
    }
    try {
        bundle = await rollup({
            input: configFile,
            plugins: [nodeResolve({ preferBuiltins: true }), typescript()],
            onwarn() { },
        });
        const result = await bundle.generate({
            exports: 'named',
            format: 'esm',
            sourcemap: false,
        });
        const [chunkOrAsset] = result.output;
        if (chunkOrAsset.type === 'chunk') {
            config = await loadConfigFromBundledFile(process.cwd(), chunkOrAsset.code);
        }
    }
    catch (error) {
        console.log(error);
    }
    if (bundle) {
        await bundle.close();
    }
    if (!config) {
        throw new Error(`No config found.`);
    }
    return config;
}
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
function getLauncherPath(launcher) {
    return fileURLToPath(new URL(`../src/launch/${launcher}/index.ts`, import.meta.url));
}
function getEngineSourceFiles() {
    return Object.fromEntries(glob
        .sync('src/engine/**/*.ts')
        .map(file => [
        relative('src', file.slice(0, file.length - extname(file).length)),
        fileURLToPath(pathToFileURL(resolve(file))),
    ]));
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
                `</html>`,
            ].join('\n');
        },
    });
}

const _require = createRequire(import.meta.url);
function workerPlugin({ inline, isBuild = false, target, }) {
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
                            paths: ['.ts'],
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
                            chunk: null,
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
                    onwarn() { },
                });
                const { output } = await bundle.generate({ sourcemap: false });
                if (cacheEntry) {
                    const [chunk] = output.filter((chunk) => chunk.type === 'chunk');
                    // TODO: To support HMR we can add all the files in `chunk.modules` to a watch-list.
                    chunk.fileName = posix.join('worker', cacheEntry.id);
                    cacheEntry.chunk = chunk;
                    return {
                        code: chunk.code,
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
                        `};`,
                    ];
                }
                return {
                    code: code.join('\n'),
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
        },
    };
}

async function buildBrowserTarget(target) {
    const bundle = await rollup({
        input: {
            index: getLauncherPath('browser'),
            ...getEngineSourceFiles(),
        },
        plugins: [
            virtual({
                'build:info': [
                    'export const plugins = new Map()',
                    '',
                    ...target.plugins.map(id => `plugins.set('${id}', await import('${id}'))`),
                ].join('\n'),
            }),
            workerPlugin({ isBuild: true, target }),
            nodeResolve({ preferBuiltins: true }),
            typescript(),
        ],
    });
    await bundle.write({
        dir: resolve('build/browser'),
        exports: 'named',
        format: 'esm',
        sourcemap: false,
    });
    await bundle.close();
}

function readFileFromContentBase(contentBase, urlPath, callback) {
    let filePath = resolve(contentBase, '.' + urlPath);
    if (urlPath.endsWith('/')) {
        filePath = resolve(filePath, 'index.html');
    }
    readFile(filePath, (error, content) => {
        callback(error, content, filePath);
    });
}

function closeServerOnTermination(server) {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];
    signals.forEach((signal) => {
        process.on(signal, () => {
            if (server) {
                server.close();
                process.exit();
            }
        });
    });
}

let server;
async function serveBrowserTarget(target) {
    const buildDir = resolve(APEX_DIR, 'build/browser');
    const wss = new WebSocketServer({ host: 'localhost', port: 24678 });
    wss.on('connection', (ws) => {
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
                    'Cross-Origin-Embedder-Policy': 'require-corp',
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
    closeServerOnTermination(server);
    const watcher = watch({
        input: {
            index: getLauncherPath('browser'),
            ...getEngineSourceFiles(),
        },
        output: {
            dir: buildDir,
            exports: 'named',
            format: 'esm',
        },
        plugins: [
            virtual({
                'build:info': [
                    'export const plugins = new Map()',
                    '',
                    ...target.plugins.map(id => `plugins.set('${id}', await import('${id}'))`),
                ].join('\n'),
            }),
            workerPlugin({ target }),
            nodeResolve({ preferBuiltins: true }),
            typescript(),
            htmlPlugin('./index.js', {}, [
                `<script type="module">`,
                `  const ws = new WebSocket('ws://localhost:24678')`,
                ``,
                `  ws.addEventListener('message', async ({data}) => {`,
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
                `</script>`,
            ].join('\n')),
        ],
    });
    watcher.on('event', async (event) => {
        console.log(`[${new Date().toLocaleTimeString()}] [browser:watcher]`, event.code);
        if (event.code === 'END') {
            if (!server.listening) {
                server.listen(3000, 'localhost', () => {
                    console.log('\nLocal: http://localhost:3000');
                });
            }
        }
        if (event.code === 'BUNDLE_END') {
            wss.clients.forEach((socket) => {
                socket.send(JSON.stringify({ type: 'update' }));
            });
            event.result.close();
        }
        if (event.code === 'ERROR') {
            console.log(event);
        }
    });
    watcher.close();
}

const cli = cac('apex-build-tool').version(pkg.version).help();
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
    const { config: configFile, platform } = options;
    try {
        const readApexConfig = measure();
        const { targets } = await getApexConfig(configFile);
        readApexConfig.done('Bundle apex config (%ss)');
        for (const targetConfig of targets) {
            if (platform && targetConfig.platform !== platform) {
                continue;
            }
            if (targetConfig.platform === 'browser') {
                await serveBrowserTarget(targetConfig);
            }
        }
    }
    catch (error) {
        console.log(error);
    }
});
cli.command('build').action(async (options) => {
    const buildCmd = measure();
    filterDuplicateOptions(options);
    const { config: configFile, platform } = options;
    try {
        const readApexConfig = measure();
        const { targets } = await getApexConfig(configFile);
        readApexConfig.done('Bundle apex config (%ss)');
        for (const targetConfig of targets) {
            if (platform && targetConfig.platform !== platform) {
                continue;
            }
            const buildTarget = measure();
            if (targetConfig.platform === 'browser') {
                await buildBrowserTarget(targetConfig);
            }
            buildTarget.done(`Build project (%ss)`);
        }
    }
    catch (error) {
        console.log(error);
    }
    finally {
        buildCmd.done('All tasks done in %ss');
        process.exit();
    }
});
cli.parse();
