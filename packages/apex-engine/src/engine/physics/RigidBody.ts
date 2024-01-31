import type RAPIER from '@dimforge/rapier3d-compat';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { float32, float64, int8, serialize, uint8, uint16 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { TickFunction } from '../TickManager';

export class RigidBodyProxy extends ProxyInstance {
  declare readonly handle: number;

  declare readonly bodyType: number;

  declare readonly angularDamping: number;

  declare readonly dominanceGroup: number;

  declare readonly angvel: [number, number, number];

  declare readonly position: [number, number, number];

  declare readonly rotation: [number, number, number, number];
}

/**
 * This class is instantiated on the physics thread and creates a proxy on the
 * game thread.
 */
@CLASS(proxy(EProxyThread.Game, RigidBodyProxy))
export class RigidBody implements IProxyOrigin {
  declare readonly tripleBuffer: TripleBuffer;

  declare readonly byteView: Uint8Array;

  @PROP(serialize(float64))
  public readonly handle: number;

  @PROP(serialize(uint8))
  public bodyType: RAPIER.RigidBodyType;

  @PROP(serialize(uint16))
  public angularDamping!: number;

  @PROP(serialize(int8))
  public dominanceGroup!: number;

  @PROP(serialize(float32, [3]))
  public readonly angvel: [number, number, number] = [0, 0, 0];

  @PROP(serialize(float32, [3]))
  public readonly position: [number, number, number] = [0, 4, 0];

  @PROP(serialize(float32, [4]))
  public readonly rotation: [number, number, number, number] = [0, 0, 0, 0];

  public readonly bodyTick: RigidBodyTickFunction;

  constructor(
    public readonly worldBody: RAPIER.RigidBody,
    @IInstantiationService protected readonly instantiationService: IInstantiationService
  ) {
    this.handle = this.worldBody.handle;
    this.bodyType = this.worldBody.bodyType();
    this.bodyTick = this.instantiationService.createInstance(RigidBodyTickFunction, this);

    this.registerTickFunction();
    this.applyWorldBodyTransformations();
  }

  public async tick(context: IEngineLoopTickContext): Promise<void> {
    this.applyWorldBodyTransformations();
  }

  protected registerTickFunction(): void {
    this.bodyTick.canTick = true;
    this.bodyTick.register();
  }

  protected applyWorldBodyTransformations(): void {
    this.angularDamping = this.worldBody.angularDamping();
    this.dominanceGroup = this.worldBody.dominanceGroup();

    {
      const { x, y, z } = this.worldBody.translation();

      this.position[0] = x;
      this.position[1] = y;
      this.position[2] = z;
    }

    {
      const { x, y, z, w } = this.worldBody.rotation();

      this.rotation[0] = x;
      this.rotation[1] = y;
      this.rotation[2] = z;
      this.rotation[3] = w;
    }

    {
      const { x, y, z } = this.worldBody.angvel();

      this.angvel[0] = x;
      this.angvel[1] = y;
      this.angvel[2] = z;
    }
  }
}

class RigidBodyTickFunction extends TickFunction<RigidBody> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.tick(context);
  }
}
