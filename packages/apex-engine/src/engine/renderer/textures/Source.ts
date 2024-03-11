import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { RenderProxy } from '../RenderProxy';

export class SourceProxy extends RenderProxy {
  declare data: ImageBitmap | OffscreenCanvas;
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
