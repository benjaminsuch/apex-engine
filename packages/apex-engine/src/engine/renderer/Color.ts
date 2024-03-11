import * as THREE from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { serialize, uint16 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { RenderProxy } from './RenderProxy';

export class ColorProxy extends RenderProxy {}

@CLASS(proxy(EProxyThread.Render, ColorProxy))
export class Color extends THREE.Color implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  @PROP(serialize(uint16))
  declare r: number;

  @PROP(serialize(uint16))
  declare g: number;

  @PROP(serialize(uint16))
  declare b: number;

  public tick(): void {}

  public getProxyArgs(): [] {
    return [];
  }
}
