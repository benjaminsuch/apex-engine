import type RAPIER from '@dimforge/rapier3d-compat';

import { CLASS } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { PhysicsTaskManager, PhysicsWorkerTask } from './PhysicsTaskManager';
import { type PhysicsWorker } from './PhysicsWorker';

export interface KinematicControllerConstructorArgs {
  offset: number;
}

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

  constructor({ offset }: KinematicControllerConstructorArgs, protected readonly physicsContext: PhysicsWorker) {
    this.worldController = this.physicsContext.world.createCharacterController(offset);
  }

  public tick(context: IEngineLoopTickContext): void {}

  public setApplyImpulsesToDynamicBodies(isEnabled: boolean): void {
    this.worldController.setApplyImpulsesToDynamicBodies(isEnabled);
  }

  public enableAutostep(maxHeight: number, minWidth: number, includeDynamicBodies: boolean): void {
    this.worldController.enableAutostep(maxHeight, minWidth, includeDynamicBodies);
  }

  public enableSnapToGround(distance: number): void {
    this.worldController.enableSnapToGround(distance);
  }

  public serializeArgs(args: any[]): any[] {
    return [];
  }
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
