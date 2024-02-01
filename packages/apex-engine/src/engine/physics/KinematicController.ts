import type RAPIER from '@dimforge/rapier3d-compat';

import { CLASS } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { TickFunction } from '../TickManager';
import { type IInternalPhysicsWorkerContext } from './Physics.worker';

export class KinematicControllerProxy extends ProxyInstance {
  declare readonly offset: number;
}

export class KinematicProxyTickFunction extends TickFunction<KinematicControllerProxy> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.tick(context);
  }
}

@CLASS(proxy(EProxyThread.Game, KinematicControllerProxy))
export class KinematicController implements IProxyOrigin {
  declare readonly tripleBuffer: TripleBuffer;

  declare readonly byteView: Uint8Array;

  public readonly worldController: RAPIER.KinematicCharacterController;

  constructor({ offset }: { offset: number }, protected readonly physicsContext: IInternalPhysicsWorkerContext) {
    this.worldController = this.physicsContext.world.createCharacterController(offset);
    this.worldController.setApplyImpulsesToDynamicBodies(true);
    this.worldController.enableAutostep(0.7, 0.3, true);
    this.worldController.enableSnapToGround(0.7);
  }

  public tick(context: IEngineLoopTickContext): void {}
}
