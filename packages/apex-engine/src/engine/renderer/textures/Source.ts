import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { serialize, uint32 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../../EngineLoop';
import { RenderProxy } from '../RenderProxy';
import { type RenderWorker } from '../RenderWorker';

export class SourceProxy extends RenderProxy<THREE.Source> {
  declare version: Source['version'];

  protected readonly object: THREE.Source;

  constructor(
    [uuid, data]: [THREE.Source['uuid'], ImageBitmap | OffscreenCanvas],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([], tb, id, thread, renderer);

    this.object = new THREE.Source(data);
    this.object.uuid = uuid;
  }

  public override tick(context: IEngineLoopTickContext): void | Promise<void> {
    super.tick(context);

    this.object.version = this.version;
  }
}

@CLASS(proxy(EProxyThread.Render, SourceProxy))
export class Source extends THREE.Source implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  declare readonly data: ImageBitmap | OffscreenCanvas;

  @PROP(serialize(uint32))
  declare version: number;

  constructor(data: Source['data']) {
    super(data);
  }

  public tick(): void {}

  public getProxyArgs(): [Source['uuid'], Source['data']] {
    return [this.uuid, this.data];
  }
}
