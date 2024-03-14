import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, float32, ref, serialize, string, uint8, uint32, vec2 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../../EngineLoop';
import { Color, type ColorProxy } from '../Color';
import { type RenderWorker } from '../RenderWorker';
import { type Texture, type TextureProxy } from '../textures/Texture';
import { MaterialProxy } from './Material';

export class MeshStandardMaterialProxy extends MaterialProxy<THREE.MeshStandardMaterial> {
  declare aoMap: TextureProxy | null;

  declare aoMapIntensity: number;

  declare lightMapIntensity: number;

  declare map: TextureProxy | null;

  declare normalMap: TextureProxy | null;

  declare roughness: number;

  declare roughnessMap: TextureProxy | null;

  declare metalness: number;

  declare metalnessMap: TextureProxy | null;

  declare emissiveIntensity: number;

  declare color: ColorProxy;

  declare side: THREE.Side;

  protected override readonly object: THREE.MeshStandardMaterial;

  constructor(
    [params]: [any],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([], tb, id, thread, renderer);

    this.object = new THREE.MeshStandardMaterial({ color: this.color.get(), ...params });
  }

  public override tick(tick: IEngineLoopTickContext): void | Promise<void> {
    super.tick(tick);

    if (this.aoMap) {
      const texture = this.aoMap.get();

      if (this.object.aoMap !== texture) {
        this.object.aoMap = texture;
      }

      this.object.needsUpdate = true;
    }

    if (this.map) {
      const texture = this.map.get();

      if (this.object.map !== texture) {
        this.object.map = texture;
      }

      this.object.needsUpdate = true;
    }

    if (this.normalMap) {
      const texture = this.normalMap.get();

      if (this.object.normalMap !== texture) {
        this.object.normalMap = texture;
      }

      this.object.needsUpdate = true;
    }

    if (this.roughnessMap) {
      const texture = this.roughnessMap.get();

      if (this.object.roughnessMap !== texture) {
        this.object.roughnessMap = texture;
      }

      this.object.needsUpdate = true;
    }

    if (this.metalnessMap) {
      const texture = this.metalnessMap.get();

      if (this.object.metalnessMap !== texture) {
        this.object.metalnessMap = texture;
      }

      this.object.needsUpdate = true;
    }
  }
}

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

  @PROP(serialize(ref(true)))
  declare emissive: Color;

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

    this.color = new Color(params?.color);
    this.emissive = new Color(params?.emissive ?? 0x000000);
  }

  public tick(): void {}

  public getProxyArgs(): [any] {
    return [
      {
        side: this.side,
        wireframe: this.wireframe,
        roughness: this.roughness,
        metalness: this.metalness,
      },
    ];
  }
}
