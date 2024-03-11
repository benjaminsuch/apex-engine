import * as THREE from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { boolean, serialize, string } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { RenderProxy } from './RenderProxy';

export class BufferGeometryProxy extends RenderProxy {
  declare name: BufferGeometry['name'];
}

@CLASS(proxy(EProxyThread.Render, BufferGeometryProxy))
export class BufferGeometry<Attributes extends THREE.NormalOrGLBufferAttributes = THREE.NormalBufferAttributes> extends THREE.BufferGeometry<Attributes> implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  @PROP(serialize(string))
  declare name: string;

  @PROP(serialize(boolean))
  declare morphTargetsRelative: boolean;

  public tick(): void {}

  public getProxyArgs(): [] {
    return [];
  }
}
