#!/usr/bin/env node
import { cac } from 'cac';
import { resolve, relative, extname, basename } from 'node:path';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import virtual from '@rollup/plugin-virtual';
import { rollup, watch } from 'rollup';
import { writeFileSync, unlinkSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import glob from 'fast-glob';
import { builtinModules } from 'node:module';
import { WebSocketServer } from 'ws';
import commonjs from '@rollup/plugin-commonjs';

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
	"@rollup/plugin-inject": "^5.0.5",
	"@rollup/plugin-json": "^6.1.0",
	"@rollup/plugin-node-resolve": "^15.2.3",
	"@rollup/plugin-swc": "^0.3.0",
	"@rollup/plugin-typescript": "^11.1.5",
	"@rollup/plugin-virtual": "^3.0.2",
	"@swc/core": "^1.3.101",
	cac: "^6.7.14",
	"fast-glob": "^3.3.2",
	"reflect-metadata": "^0.2.1",
	rollup: "^4.9.1",
	ws: "^8.15.1"
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
	dependencies: dependencies
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
            nodeResolve({ preferBuiltins: true }),
            typescript(),
        ],
        onwarn() { },
    });
    await bundle.write({
        dir: resolve('build/browser'),
        exports: 'named',
        format: 'esm',
        sourcemap: false,
    });
    await bundle.close();
}

function apexPlugins({ plugins }, { buildDir }) {
    const input = plugins.map(id => resolve(id));
    return {
        name: 'apex-plugins',
        async buildStart() {
            console.log('build start');
            let bundle;
            try {
                bundle = await rollup({
                    input,
                    plugins: [
                        nodeResolve({ preferBuiltins: true }),
                        typescript(),
                        commonjs(),
                    ],
                });
                await bundle.write({
                    dir: resolve(buildDir, 'plugins'),
                    format: 'esm',
                    exports: 'named',
                    sourcemap: false,
                });
                const code = [
                    'export const pluginMap = new Map()',
                    '',
                    ...plugins.map(id => `pluginMap.set('${id}', import('${basename(id)}'))`),
                ].join('\n');
                // writeFileSync(resolve(buildDir, 'plugins/index.js'), code, 'utf-8');
            }
            catch (error) {
                console.log(error);
            }
            if (bundle) {
                await bundle.close();
            }
        },
    };
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

async function serveBrowserTarget(target) {
    const buildDir = resolve(APEX_DIR, 'build/browser');
    const wss = new WebSocketServer({ host: 'localhost', port: 24678 });
    wss.on('connection', (ws) => {
        ws.on('error', console.error);
    });
    closeServerOnTermination(wss);
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
            nodeResolve({ preferBuiltins: true }),
            typescript(),
            apexPlugins(target, { buildDir }),
        ],
    });
    watcher.on('event', async (event) => {
        console.log(`[${new Date().toLocaleTimeString()}] [browser:watcher]`, event.code);
    });
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
