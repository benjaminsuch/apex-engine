import type RAPIER from '@dimforge/rapier3d-compat';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { float64, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { TickFunction } from '../TickManager';

export class ColliderProxy extends ProxyInstance {
  declare readonly handle: number;
}

@CLASS(proxy(EProxyThread.Game, ColliderProxy))
export class Collider implements IProxyOrigin {
  declare readonly tripleBuffer: TripleBuffer;

  declare readonly byteView: Uint8Array;

  @PROP(serialize(float64))
  public readonly handle: number;

  public readonly colliderTick: ColliderTickFunction;

  constructor(
    public readonly worldCollider: RAPIER.Collider,
    @IInstantiationService protected readonly instantiationService: IInstantiationService
  ) {
    this.handle = this.worldCollider.handle;
    this.colliderTick = this.instantiationService.createInstance(ColliderTickFunction, this);
  }

  public async tick(context: IEngineLoopTickContext): Promise<void> {}

  protected registerTickFunction(): void {
    this.colliderTick.canTick = true;
    this.colliderTick.register();
  }
}

class ColliderTickFunction extends TickFunction<Collider> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.tick(context);
  }
}
