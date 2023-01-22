import { ApexEngine, EngineLoop, GameInstance } from '../engine';

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

export function configureLauncher({
  gameEngineClass = ApexEngine,
  gameInstanceClass = GameInstance,
  defaultLevel
}: LauncherConfig) {
  console.log('IS_CLIENT', IS_CLIENT, 'IS_SERVER', IS_SERVER);
  main();
}
