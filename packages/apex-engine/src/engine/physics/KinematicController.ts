import type RAPIER from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { ref, serialize, vec3 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { type Collider, type ColliderProxy } from './Collider';
import { type IInternalPhysicsWorkerContext } from './Physics.worker';

export class KinematicControllerProxy extends ProxyInstance {
  declare readonly offset: number;

  declare movement: [number, number, number];

  declare readonly collider?: Collider;

  public worldController: RAPIER.KinematicCharacterController;

  constructor(
    args: [number] = [0],
    tb: TripleBuffer,
    public override readonly id: number,
    protected readonly physicsContext: IInternalPhysicsWorkerContext
  ) {
    super(args, tb, id);

    this.offset = args[0];
    this.worldController = this.physicsContext.world.createCharacterController(this.offset);
    this.worldController.setApplyImpulsesToDynamicBodies(true);
    this.worldController.enableAutostep(0.7, 0.3, true);
    this.worldController.enableSnapToGround(0.7);
  }

  public override tick(tick: IEngineLoopTickContext): void {
    const [x, y, z] = this.movement;

    // this.worldController.computeColliderMovement(characterCollider, { x, y, z });
  }
}

@CLASS(proxy(EProxyThread.Physics, KinematicControllerProxy))
export class KinematicController {
  @PROP(serialize(ref))
  public collider: ColliderProxy | null = null;

  @PROP(serialize(vec3))
  public movement: Vector3 = new Vector3();

  constructor(public readonly offset: number) {}

  public tick(): void {}
}
