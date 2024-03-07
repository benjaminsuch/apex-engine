import * as THREE from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { serialize, uint16 } from '../core/class/specifiers/serialize';
import { RenderProxy } from './RenderProxy';

export class ColorProxy extends RenderProxy {}

@CLASS(proxy(EProxyThread.Render, ColorProxy))
export class Color extends THREE.Color {
  @PROP(serialize(uint16))
  declare r: number;

  @PROP(serialize(uint16))
  declare g: number;

  @PROP(serialize(uint16))
  declare b: number;
}
