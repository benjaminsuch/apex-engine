import { ApexEngine, EngineLoop, GameInstance } from 'src/engine';

const isEngineExitRequested = () => false;

export function main() {
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

export function configureLauncher(config: LauncherConfig) {
  // - load config from index.ts file
  //   - call default export from module
  //
}
