import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, float32, ref, serialize, string, uint8 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type Color } from '../Color';
import { type Texture } from '../textures/Texture';
import { MaterialProxy } from './Material';

export class MeshBasicMaterialProxy extends MaterialProxy {}

export interface MeshBasicMaterialParameters extends Omit<THREE.MeshBasicMaterialParameters, 'color'> {
  color?: Color;
}

@CLASS(proxy(EProxyThread.Render, MeshBasicMaterialProxy))
export class MeshBasicMaterial extends THREE.MeshBasicMaterial implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  @PROP(serialize(ref(true)))
  declare color: Color;

  @PROP(serialize(ref))
  declare alphaMap: Texture | null;

  @PROP(serialize(ref))
  declare envMap: Texture | null;

  @PROP(serialize(ref))
  declare combine: THREE.Combine;

  @PROP(serialize(ref))
  declare aoMap: Texture | null;

  @PROP(serialize(float32))
  declare aoMapIntensity: number;

  @PROP(serialize(ref))
  declare map: Texture | null;

  @PROP(serialize(ref))
  declare lightMap: Texture | null;

  @PROP(serialize(uint8))
  declare lightMapIntensity: number;

  @PROP(serialize(ref))
  declare specularMap: Texture | null;

  @PROP(serialize(uint8))
  declare reflectivity: number;

  @PROP(serialize(uint8))
  declare refractionRatio: number;

  @PROP(serialize(boolean))
  declare fog: boolean;

  @PROP(serialize(boolean))
  declare wireframe: boolean;

  @PROP(serialize(float32))
  declare wireframeLinewidth: number;

  @PROP(serialize(string, 6))
  declare wireframeLinecap: 'butt' | 'round' | 'square';

  @PROP(serialize(string, 5))
  declare wireframeLinejoin: 'round' | 'bevel' | 'miter';

  constructor(params?: MeshBasicMaterialParameters) {
    super(params);
  }

  public tick(): void {}

  public getProxyArgs(): any[] {
    return [];
  }
}
