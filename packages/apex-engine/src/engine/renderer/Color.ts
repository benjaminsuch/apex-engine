import * as THREE from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { float32, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { RenderProxy } from './RenderProxy';
import { type RenderWorker } from './RenderWorker';

export class ColorProxy extends RenderProxy<THREE.Color> {
  declare r: number;

  declare g: number;

  declare b: number;

  protected readonly object: THREE.Color;

  constructor(
    [r, g, b]: [number, number, number],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([], tb, id, thread, renderer);

    this.object = new THREE.Color(r, g, b);
  }
}

@CLASS(proxy(EProxyThread.Render, ColorProxy))
export class Color extends THREE.Color implements IProxyOrigin {
  declare readonly byteView: IProxyOrigin['byteView'];

  declare readonly tripleBuffer: IProxyOrigin['tripleBuffer'];

  declare readonly cancelDeployment: IProxyOrigin['cancelDeployment'];

  @PROP(serialize(float32))
  declare r: number;

  @PROP(serialize(float32))
  declare g: number;

  @PROP(serialize(float32))
  declare b: number;

  public tick(): void {}

  public getProxyArgs(): [number] {
    return [this.getHex()];
  }
}
