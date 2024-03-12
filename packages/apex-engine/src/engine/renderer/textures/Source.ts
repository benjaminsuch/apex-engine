import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { RenderProxy } from '../RenderProxy';
import { type RenderWorker } from '../RenderWorker';

export class SourceProxy extends RenderProxy<THREE.Source> {
  protected readonly object: THREE.Source;

  constructor(
    [data]: [ImageBitmap | OffscreenCanvas],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([], tb, id, thread, renderer);

    this.object = new THREE.Source(data);
  }
}

@CLASS(proxy(EProxyThread.Render, SourceProxy))
export class Source extends THREE.Source implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  declare readonly data: ImageBitmap | OffscreenCanvas;

  constructor(data: Source['data']) {
    super(data);
  }

  public tick(): void {}

  public getProxyArgs(): [Source['data']] {
    return [this.data];
  }
}
