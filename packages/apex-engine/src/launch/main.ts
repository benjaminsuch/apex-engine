import { EngineLoop } from 'src/engine/EngineLoop';

const isEngineExitRequested = () => false;

export default function main() {
  const engineLoop = new EngineLoop();

  engineLoop.preInit();
  engineLoop.init();

  if (!isEngineExitRequested()) {
    engineLoop.tick();
  }
}
