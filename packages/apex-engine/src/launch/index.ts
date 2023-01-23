import { ApexEngine, EngineLoop, GameInstance } from '../engine';
import { configureBrowserLauncher } from './configureBrowserLauncher';
import { configureServerLauncher } from './configureServerLauncher';

const isEngineExitRequested = () => false;

function main() {
  const engineLoop = new EngineLoop();

  engineLoop.preInit();
  engineLoop.init();

  if (!isEngineExitRequested()) {
    engineLoop.tick();
  }
}

export interface LauncherConfig {
  /**
   * Overrides the default GameEngine class.
   */
  gameEngineClass?: typeof ApexEngine;
  /**
   * Overrides the default GameInstance class.
   */
  gameInstanceClass?: typeof GameInstance;
  /**
   * The relative path to your level.
   */
  defaultLevel: string;
  /**
   * You can define plugins to enhance the engine with features.
   */
  plugins?: Record<string, any>[];
}

export function launch() {
  console.log('IS_CLIENT', IS_CLIENT, 'IS_SERVER', IS_SERVER);
  if (IS_SERVER) {
    return configureServerLauncher(main);
  }
  if (IS_CLIENT) {
    return configureBrowserLauncher(main)();
  }
}
