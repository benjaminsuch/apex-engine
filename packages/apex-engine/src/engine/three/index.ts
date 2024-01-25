// At the current state of development, importing threejs in your project via
// `import ... from 'three'` will cause the build-tool to bundle threejs twice,
// which will cause the console to output a warning.
//
// Importing threejs modules from the apex-engine (`import ... from 'apex-engine/src/engine/three'`)
// fixes it. While this is certainly not the way it should be done, it works :P
//
// @todo: Fix bundling in abt
export * from 'three';
