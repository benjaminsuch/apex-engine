import * as THREE from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { boolean, serialize, string } from '../core/class/specifiers/serialize';
import { RenderProxy } from './RenderProxy';

export class BufferGeometryProxy extends RenderProxy {
  declare name: BufferGeometry['name'];
}

@CLASS(proxy(EProxyThread.Render, BufferGeometryProxy))
export class BufferGeometry<Attributes extends THREE.NormalOrGLBufferAttributes = THREE.NormalBufferAttributes> extends THREE.BufferGeometry<Attributes> {
  @PROP(serialize(string))
  declare name: string;

  @PROP(serialize(boolean))
  declare morphTargetsRelative: boolean;
}
