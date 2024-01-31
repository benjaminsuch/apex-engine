import type RAPIER from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { ref, serialize, vec3 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { TickFunction } from '../TickManager';
import { type Collider, type ColliderProxy } from './Collider';
import { type IInternalPhysicsWorkerContext } from './Physics.worker';

export class KinematicControllerProxy extends ProxyInstance {
  declare readonly offset: number;

  declare movement: [number, number, number];

  declare readonly collider?: Collider;

  public readonly worldController: RAPIER.KinematicCharacterController;

  public readonly proxyTick: KinematicProxyTickFunction;

  constructor(
    args: [number] = [0],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    protected readonly physicsContext: IInternalPhysicsWorkerContext,
    @IInstantiationService protected readonly instantiationService: IInstantiationService
  ) {
    super(args, tb, id, thread);

    this.offset = args[0];

    this.worldController = this.physicsContext.world.createCharacterController(this.offset);
    this.worldController.setApplyImpulsesToDynamicBodies(true);
    this.worldController.enableAutostep(0.7, 0.3, true);
    this.worldController.enableSnapToGround(0.7);

    this.proxyTick = this.instantiationService.createInstance(KinematicProxyTickFunction, this);
    this.proxyTick.canTick = true;
    this.proxyTick.register();
  }

  public override tick(tick: IEngineLoopTickContext): void {
    const [x, y, z] = this.movement;

    if (this.collider) {
      this.worldController.computeColliderMovement(this.collider.worldCollider, { x, y, z });
    }
  }
}

export class KinematicProxyTickFunction extends TickFunction<KinematicControllerProxy> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.tick(context);
  }
}

@CLASS(proxy(EProxyThread.Physics, KinematicControllerProxy))
export class KinematicController implements IProxyOrigin {
  declare readonly tripleBuffer: TripleBuffer;

  declare readonly byteView: Uint8Array;

  @PROP(serialize(ref))
  public collider: ColliderProxy | null = null;

  @PROP(serialize(vec3))
  public movement: Vector3 = new Vector3();

  constructor(public readonly offset: number) {}

  public async tick(context: IEngineLoopTickContext): Promise<void> {}
}
