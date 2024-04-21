import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, proxy } from '../../core/class/specifiers/proxy';
import { boolean, float32, ref, serialize, string } from '../../core/class/specifiers/serialize';
import { type Color } from '../Color';
import { type Texture } from '../textures/Texture';
import { MaterialProxy } from './Material';

export class LineBasicMaterialProxy extends MaterialProxy {}

export interface LineBasicMaterialParameters extends Omit<THREE.LineBasicMaterialParameters, 'color'> {
  color?: Color;
}

@CLASS(proxy(EProxyThread.Render, LineBasicMaterialProxy))
export class LineBasicMaterial extends THREE.LineBasicMaterial {
  @PROP(serialize(ref(true)))
  declare color: Color;

  @PROP(serialize(boolean))
  declare fog: boolean;

  @PROP(serialize(float32))
  declare linewidth: number;

  @PROP(serialize(string, 6))
  declare linecap: 'butt' | 'round' | 'square';

  @PROP(serialize(string, 5))
  declare linejoin: 'round' | 'bevel' | 'miter';

  @PROP(serialize(ref))
  declare map: Texture | null;

  constructor(params: LineBasicMaterialParameters) {
    super(params);
  }
}
