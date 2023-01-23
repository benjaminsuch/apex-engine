import { EngineLoop } from '../engine';

const isEngineExitRequested = () => false;

function main() {
  const engineLoop = new EngineLoop();

  engineLoop.preInit();
  engineLoop.init();

  if (!isEngineExitRequested()) {
    engineLoop.tick();
  }
}

const configureServerLauncher = IS_SERVER
  ? (await import('./configureServerLauncher')).configureServerLauncher
  : undefined;
const configureBrowserLauncher = IS_CLIENT
  ? (await import('./configureBrowserLauncher')).configureBrowserLauncher
  : undefined;

export function launch() {
  if (IS_SERVER) {
    return configureServerLauncher?.(main);
  }
  if (IS_CLIENT) {
    return configureBrowserLauncher?.(main)();
  }
}
