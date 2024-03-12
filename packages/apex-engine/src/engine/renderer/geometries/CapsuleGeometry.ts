import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, serialize, string } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { RenderProxy } from '../RenderProxy';
import { type RenderWorker } from '../RenderWorker';

export class CapsuleGeometryProxy extends RenderProxy<THREE.CapsuleGeometry> {
  protected readonly object: THREE.CapsuleGeometry;

  constructor(
    [data]: [any],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([], tb, id, thread, renderer);

    this.object = THREE.CapsuleGeometry.fromJSON(data);
  }
}

export interface CapsuleGeometryJSON {}

@CLASS(proxy(EProxyThread.Render, CapsuleGeometryProxy))
export class CapsuleGeometry extends THREE.CapsuleGeometry implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  public tick(): void {}

  public getProxyArgs(): [any] {
    const { metadata, uuid, ...rest } = this.toJSON() as any;
    return [rest];
  }
}
