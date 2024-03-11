import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, float32, ref, serialize, string, uint8, uint32, vec2 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type Color } from '../Color';
import { type Texture } from '../textures/Texture';
import { MaterialProxy } from './Material';

export class MeshStandardMaterialProxy extends MaterialProxy {}

export interface MeshStandardMaterialParameters extends Omit<THREE.MeshStandardMaterialParameters, 'color'> {
  color?: Color;
}

@CLASS(proxy(EProxyThread.Render, MeshStandardMaterialProxy))
export class MeshStandardMaterial extends THREE.MeshStandardMaterial implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  @PROP(serialize(ref(true)))
  declare color: Color;

  @PROP(serialize(ref))
  declare aoMap: Texture | null;

  @PROP(serialize(float32))
  declare aoMapIntensity: number;

  @PROP(serialize(uint8))
  declare roughness: number;

  @PROP(serialize(uint8))
  declare metalness: number;

  @PROP(serialize(ref))
  declare map: Texture | null;

  @PROP(serialize(ref))
  declare lightMap: Texture | null;

  @PROP(serialize(uint8))
  declare lightMapIntensity: number;

  @PROP(serialize(uint8))
  declare emissiveIntensity: number;

  @PROP(serialize(ref))
  declare emissiveMap: Texture | null;

  @PROP(serialize(ref))
  declare bumpMap: Texture | null;

  @PROP(serialize(uint8))
  declare bumpScale: number;

  @PROP(serialize(ref))
  declare normalMap: Texture | null;

  @PROP(serialize(uint8))
  declare normalMapType: THREE.NormalMapTypes;

  @PROP(serialize(vec2))
  declare normalScale: THREE.Vector2;

  @PROP(serialize(ref))
  declare displacementMap: Texture | null;

  @PROP(serialize(uint8))
  declare displacementScale: number;

  @PROP(serialize(uint32))
  declare displacementBias: number;

  @PROP(serialize(ref))
  declare roughnessMap: Texture | null;

  @PROP(serialize(ref))
  declare metalnessMap: Texture | null;

  @PROP(serialize(ref))
  declare alphaMap: Texture | null;

  @PROP(serialize(ref))
  declare envMap: Texture | null;

  @PROP(serialize(uint8))
  declare envMapIntensity: number;

  @PROP(serialize(boolean))
  declare wireframe: boolean;

  @PROP(serialize(float32))
  declare wireframeLinewidth: number;

  @PROP(serialize(string, 6))
  declare wireframeLinecap: 'butt' | 'round' | 'square';

  @PROP(serialize(string, 5))
  declare wireframeLinejoin: 'round' | 'bevel' | 'miter';

  @PROP(serialize(boolean))
  declare flatShading: boolean;

  @PROP(serialize(boolean))
  declare fog: boolean;

  constructor(params?: MeshStandardMaterialParameters) {
    super(params);
  }

  public tick(): void {}

  public getProxyArgs(): any[] {
    return [];
  }
}
