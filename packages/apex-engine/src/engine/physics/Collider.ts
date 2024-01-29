import type RAPIER from '@dimforge/rapier3d-compat';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { float64, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { ProxyInstance } from '../ProxyInstance';

export class ColliderProxy extends ProxyInstance {}

@CLASS(proxy(EProxyThread.Game, ColliderProxy))
export class Collider {
  declare readonly tripleBuffer: TripleBuffer;

  declare readonly byteView: Uint8Array;

  @PROP(serialize(float64))
  public readonly handle: number;

  constructor(public readonly worldCollider: RAPIER.Collider) {
    this.handle = this.worldCollider.handle;
  }
}
