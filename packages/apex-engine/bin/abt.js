#!/usr/bin/env node
import { cac } from 'cac';
import { writeFileSync, unlinkSync } from 'node:fs';
import { resolve, relative, extname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import glob from 'fast-glob';
import { rollup, watch } from 'rollup';
import { builtinModules } from 'node:module';
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
	"@rollup/plugin-json": "^6.1.0",
	"@rollup/plugin-node-resolve": "^15.2.3",
	"@rollup/plugin-typescript": "^11.1.5",
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

const CONFIG_FILE_NAME = 'apex.config';
const APEX_DIR = resolve('.apex');
async function getApexConfig(configFile = resolve(`${CONFIG_FILE_NAME}.ts`)) {
    let bundle;
    let config;
    try {
        bundle = await rollup({
            input: configFile,
            plugins: [nodeResolve({ preferBuiltins: true }), typescript()],
            onwarn() { },
        });
        const result = await bundle.generate({
            exports: 'named',
            format: 'esm',
            externalLiveBindings: false,
            freeze: false,
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

// import { closeServerOnTermination } from './server';
async function serveBrowserTarget(target) {
    const buildDir = resolve(APEX_DIR, 'build/browser');
    const wss = new WebSocketServer({ host: 'localhost', port: 24678 });
    wss.on('connection', (ws) => {
        ws.on('error', console.error);
    });
    // closeServerOnTermination()
    const input = {
        index: getLauncherPath('browser'),
        ...getEngineSourceFiles(),
    };
    console.log('input', input);
    const watcher = watch({
        input,
        output: {
            dir: buildDir,
        },
        plugins: [
            nodeResolve({ preferBuiltins: true }),
            typescript({ outDir: buildDir }),
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
    const { config: configFile, debug, platform, target } = options;
    try {
        const { targets } = await getApexConfig(configFile);
        for (const targetConfig of targets) {
            if (platform && targetConfig.platform !== platform) {
                continue;
            }
            if (targetConfig.platform === 'browser') {
                await serveBrowserTarget(targetConfig);
            }
        }
        process.exit();
    }
    catch (error) {
        console.log(error);
    }
});
cli.parse();
