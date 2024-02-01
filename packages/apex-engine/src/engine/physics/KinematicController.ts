import type RAPIER from '@dimforge/rapier3d-compat';

import { CLASS } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { type IInternalPhysicsWorkerContext } from './Physics.worker';
import { PhysicsTaskManager, PhysicsWorkerTask } from './PhysicsTaskManager';

export class KinematicControllerProxy extends ProxyInstance {
  declare readonly offset: number;

  public setApplyImpulsesToDynamicBodies(isEnabled: boolean): void {
    PhysicsTaskManager.addTask(new SetApplyImpulsesToDynamicBodiesTask(this, isEnabled));
  }

  public enableAutostep(maxHeight: number, minWidth: number, includeDynamicBodies: boolean): void {
    PhysicsTaskManager.addTask(new EnableAutostepTask(this, [maxHeight, minWidth, includeDynamicBodies]));
  }

  public enableSnapToGround(distance: number): void {
    PhysicsTaskManager.addTask(new EnableSnapToGroundTask(this, distance));
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

class SetApplyImpulsesToDynamicBodiesTask extends PhysicsWorkerTask<KinematicControllerProxy, 'setApplyImpulsesToDynamicBodies', [boolean]> {
  constructor(target: KinematicControllerProxy, isEnabled: boolean) {
    super(target, 'setApplyImpulsesToDynamicBodies', [isEnabled]);
  }
}

type EnableAutostepTaskParams = [number, number, boolean];

class EnableAutostepTask extends PhysicsWorkerTask<KinematicControllerProxy, 'enableAutostep', EnableAutostepTaskParams> {
  constructor(target: KinematicControllerProxy, params: EnableAutostepTaskParams) {
    super(target, 'enableAutostep', params);
  }
}

class EnableSnapToGroundTask extends PhysicsWorkerTask<KinematicControllerProxy, 'enableSnapToGround', [number]> {
  constructor(target: KinematicControllerProxy, distance: number) {
    super(target, 'enableSnapToGround', [distance]);
  }
}
