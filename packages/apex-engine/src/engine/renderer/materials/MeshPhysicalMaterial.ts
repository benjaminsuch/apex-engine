import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, float32, ref, serialize, string, uint8, uint32, vec2 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../../EngineLoop';
import { Color, type ColorProxy } from '../Color';
import { type RenderWorker } from '../RenderWorker';
import { type Texture, type TextureProxy } from '../textures/Texture';
import { MeshStandardMaterialProxy, type MeshStandardMaterialProxyArgs } from './MeshStandardMaterial';

export class MeshPhysicalMaterialProxy extends MeshStandardMaterialProxy {
  declare anisotropy?: number | undefined;

  declare attenuationColor: ColorProxy;

  declare attenuationDistance: number;

  declare clearcoat: number;

  declare clearcoatMap: TextureProxy | null;

  declare clearcoatNormalMap: TextureProxy | null;

  declare clearcoatNormalScale: [number, number];

  declare clearcoatRoughness: number;

  declare clearcoatRoughnessMap: TextureProxy | null;

  declare iridescence: number;

  declare iridescenceIOR: number;

  declare iridescenceMap: TextureProxy | null;

  declare iridescenceThicknessMap: TextureProxy | null;

  declare iridescenceThicknessRange: [number, number];

  declare sheen: number;

  declare sheenColor: ColorProxy;

  declare sheenColorMap: TextureProxy | null;

  declare sheenRoughness: number;

  declare sheenRoughnessMap: TextureProxy | null;

  declare specularColor: ColorProxy;

  declare specularColorMap: TextureProxy | null;

  declare specularIntensity: number;

  declare specularIntensityMap: TextureProxy | null;

  declare transmission: number;

  declare transmissionMap: TextureProxy | null;

  protected override readonly object: THREE.MeshPhysicalMaterial;

  constructor([params]: [MeshPhysicalMaterialProxyArgs], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super([params], tb, id, thread, renderer);

    const { name, normalScale: normalScaleArr, uuid, clearcoatNormalScale: clearcoatNormalScaleArr, ...rest } = params;

    const normalScale = new THREE.Vector2().fromArray(normalScaleArr);
    const clearcoatNormalScale = clearcoatNormalScaleArr ? new THREE.Vector2().fromArray(clearcoatNormalScaleArr) : undefined;

    this.object = new THREE.MeshPhysicalMaterial({ color: this.color.get(), normalScale, clearcoatNormalScale, ...rest });

    this.object.name = name;
    this.object.uuid = uuid;
  }

  public override tick(context: IEngineLoopTickContext): void | Promise<void> {
    super.tick(context);

    this.object.anisotropy = this.anisotropy;

    if (this.attenuationColor) this.object.attenuationColor.copy(this.attenuationColor.get());

    this.object.attenuationDistance = this.attenuationDistance;
    this.object.clearcoat = this.clearcoat;

    if (this.clearcoatMap) {
      const texture = this.clearcoatMap.get();

      if (this.object.clearcoatMap !== texture) {
        this.object.clearcoatMap = texture;
      }
    }

    if (this.clearcoatNormalMap) {
      const texture = this.clearcoatNormalMap.get();

      if (this.object.clearcoatNormalMap !== texture) {
        this.object.clearcoatNormalMap = texture;
      }
    }

    this.object.clearcoatNormalScale.fromArray(this.clearcoatNormalScale);
    this.object.clearcoatRoughness = this.clearcoatRoughness;

    if (this.clearcoatRoughnessMap) {
      const texture = this.clearcoatRoughnessMap.get();

      if (this.object.clearcoatRoughnessMap !== texture) {
        this.object.clearcoatRoughnessMap = texture;
      }
    }

    this.object.iridescence = this.iridescence;
    this.object.iridescenceIOR = this.iridescenceIOR;

    if (this.iridescenceMap) {
      const texture = this.iridescenceMap.get();

      if (this.object.iridescenceMap !== texture) {
        this.object.iridescenceMap = texture;
      }
    }

    if (this.iridescenceThicknessMap) {
      const texture = this.iridescenceThicknessMap.get();

      if (this.object.iridescenceThicknessMap !== texture) {
        this.object.iridescenceThicknessMap = texture;
      }
    }

    this.object.iridescenceThicknessRange = this.iridescenceThicknessRange;
    this.object.sheen = this.sheen;

    if (this.sheenColor) this.object.sheenColor.copy(this.sheenColor.get());

    if (this.sheenColorMap) {
      const texture = this.sheenColorMap.get();

      if (this.object.sheenColorMap !== texture) {
        this.object.sheenColorMap = texture;
      }
    }

    this.object.sheenRoughness = this.sheenRoughness;

    if (this.sheenRoughnessMap) {
      const texture = this.sheenRoughnessMap.get();

      if (this.object.sheenRoughnessMap !== texture) {
        this.object.sheenRoughnessMap = texture;
      }
    }

    if (this.specularColor) this.object.specularColor.copy(this.specularColor.get());

    if (this.specularColorMap) {
      const texture = this.specularColorMap.get();

      if (this.object.specularColorMap !== texture) {
        this.object.specularColorMap = texture;
      }
    }

    this.object.specularIntensity = this.specularIntensity;

    if (this.specularIntensityMap) {
      const texture = this.specularIntensityMap.get();

      if (this.object.specularIntensityMap !== texture) {
        this.object.specularIntensityMap = texture;
      }
    }

    this.object.transmission = this.transmission;

    if (this.transmissionMap) {
      const texture = this.transmissionMap.get();

      if (this.object.transmissionMap !== texture) {
        this.object.transmissionMap = texture;
      }
    }
  }
}

export interface MeshPhysicalMaterialParameters extends Omit<THREE.MeshPhysicalMaterialParameters, 'color'> {
  color?: Color;
}

export interface MeshPhysicalMaterialProxyArgs extends MeshStandardMaterialProxyArgs {
  anisotropy?: number;
  anisotropyRotation?: number;
  attenuationDistance?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  clearcoatNormalScale?: [number, number];
  ior: number;
  iridescence?: number;
  iridescenceIOR?: number;
  iridescenceThicknessRange: [number, number];
  sheen?: number;
  sheenRoughness?: number;
  specularIntensity?: number;
  thickness?: number;
  transmission?: number;
}

@CLASS(proxy(EProxyThread.Render, MeshPhysicalMaterialProxy))
export class MeshPhysicalMaterial extends THREE.MeshPhysicalMaterial implements IProxyOrigin {
  declare readonly byteView: IProxyOrigin['byteView'];

  declare readonly tripleBuffer: IProxyOrigin['tripleBuffer'];

  declare readonly cancelDeployment: IProxyOrigin['cancelDeployment'];

  @PROP(serialize(boolean))
  declare alphaHash: boolean;

  @PROP(serialize(ref))
  declare alphaMap: Texture | null;

  @PROP(serialize(uint8))
  declare alphaTest: number;

  @PROP(serialize(boolean))
  declare alphaToCoverage: boolean;

  @PROP(serialize(uint8))
  declare anisotropy?: number | undefined;

  @PROP(serialize(ref))
  declare aoMap: Texture | null;

  @PROP(serialize(float32))
  declare aoMapIntensity: number;

  @PROP(serialize(ref))
  declare attenuationColor: THREE.Color;

  @PROP(serialize(uint32))
  declare attenuationDistance: number;

  @PROP(serialize(uint8))
  declare blendAlpha: number;

  @PROP(serialize(uint8))
  declare blendDst: THREE.BlendingDstFactor;

  @PROP(serialize(uint8))
  declare blendDstAlpha: number | null;

  @PROP(serialize(uint8))
  declare blendEquation: THREE.BlendingEquation;

  @PROP(serialize(uint8))
  declare blendEquationAlpha: number | null;

  @PROP(serialize(uint8))
  declare blending: THREE.Blending;

  @PROP(serialize(uint8))
  declare blendSrc: THREE.BlendingSrcFactor | THREE.BlendingDstFactor;

  @PROP(serialize(uint8))
  declare blendSrcAlpha: number | null;

  @PROP(serialize(ref))
  declare bumpMap: Texture | null;

  @PROP(serialize(uint8))
  declare bumpScale: number;

  @PROP(serialize(uint8))
  declare clearcoat: number;

  @PROP(serialize(ref))
  declare clearcoatMap: THREE.Texture | null;

  @PROP(serialize(ref))
  declare clearcoatNormalMap: THREE.Texture | null;

  @PROP(serialize(vec2))
  declare clearcoatNormalScale: THREE.Vector2;

  @PROP(serialize(uint8))
  declare clearcoatRoughness: number;

  @PROP(serialize(ref))
  declare clearcoatRoughnessMap: THREE.Texture | null;

  @PROP(serialize(boolean))
  declare clipIntersection: boolean;

  @PROP(serialize(boolean))
  declare clipShadows: boolean;

  @PROP(serialize(ref(true)))
  declare color: Color;

  @PROP(serialize(boolean))
  declare colorWrite: boolean;

  @PROP(serialize(uint8))
  declare depthFunc: THREE.DepthModes;

  @PROP(serialize(boolean))
  declare depthTest: boolean;

  @PROP(serialize(ref))
  declare displacementMap: Texture | null;

  @PROP(serialize(uint8))
  declare displacementScale: number;

  @PROP(serialize(uint32))
  declare displacementBias: number;

  @PROP(serialize(boolean))
  declare dithering: boolean;

  @PROP(serialize(boolean))
  declare flatShading: boolean;

  @PROP(serialize(boolean))
  declare fog: boolean;

  @PROP(serialize(ref(true)))
  declare emissive: Color;

  @PROP(serialize(uint8))
  declare emissiveIntensity: number;

  @PROP(serialize(ref))
  declare emissiveMap: Texture | null;

  @PROP(serialize(ref))
  declare envMap: Texture | null;

  @PROP(serialize(uint8))
  declare envMapIntensity: number;

  @PROP(serialize(boolean))
  declare forceSinglePass: boolean;

  @PROP(serialize(uint8))
  declare iridescence: number;

  @PROP(serialize(uint8))
  declare iridescenceIOR: number;

  @PROP(serialize(ref))
  declare iridescenceMap: THREE.Texture | null;

  @PROP(serialize(ref))
  declare iridescenceThicknessMap: THREE.Texture | null;

  @PROP(serialize(uint32, [2]))
  declare iridescenceThicknessRange: [number, number];

  @PROP(serialize(ref))
  declare lightMap: Texture | null;

  @PROP(serialize(uint8))
  declare lightMapIntensity: number;

  @PROP(serialize(ref))
  declare map: Texture | null;

  @PROP(serialize(uint8))
  declare metalness: number;

  @PROP(serialize(ref))
  declare metalnessMap: Texture | null;

  @PROP(serialize(ref))
  declare normalMap: Texture | null;

  @PROP(serialize(uint8))
  declare normalMapType: THREE.NormalMapTypes;

  @PROP(serialize(vec2))
  declare normalScale: THREE.Vector2;

  @PROP(serialize(uint8))
  declare opacity: number;

  @PROP(serialize(boolean))
  declare polygonOffset: boolean;

  @PROP(serialize(uint32))
  declare polygonOffsetFactor: number;

  @PROP(serialize(uint32))
  declare polygonOffsetUnits: number;

  @PROP(serialize(string, 7))
  declare precision: 'highp' | 'mediump' | 'lowp' | null;

  @PROP(serialize(boolean))
  declare premultipliedAlpha: boolean;

  @PROP(serialize(uint8))
  declare roughness: number;

  @PROP(serialize(ref))
  declare roughnessMap: Texture | null;

  @PROP(serialize(uint8))
  declare sheen: number;

  @PROP(serialize(ref))
  declare sheenColor: THREE.Color;

  @PROP(serialize(ref))
  declare sheenColorMap: THREE.Texture | null;

  @PROP(serialize(uint8))
  declare sheenRoughness: number;

  @PROP(serialize(ref))
  declare sheenRoughnessMap: THREE.Texture | null;

  @PROP(serialize(uint8))
  declare shadowSide: THREE.Side | null;

  @PROP(serialize(uint8))
  declare side: THREE.Side;

  @PROP(serialize(ref))
  declare specularColor: THREE.Color;

  @PROP(serialize(ref))
  declare specularColorMap: THREE.Texture | null;

  @PROP(serialize(uint8))
  declare specularIntensity: number;

  @PROP(serialize(ref))
  declare specularIntensityMap: THREE.Texture | null;

  @PROP(serialize(boolean))
  declare stencilWrite: boolean;

  @PROP(serialize(uint8))
  declare stencilFunc: THREE.StencilFunc;

  @PROP(serialize(uint32))
  declare stencilRef: number;

  @PROP(serialize(uint32))
  declare stencilWriteMask: number;

  @PROP(serialize(uint32))
  declare stencilFuncMask: number;

  @PROP(serialize(uint8))
  declare stencilFail: THREE.StencilOp;

  @PROP(serialize(uint8))
  declare stencilZFail: THREE.StencilOp;

  @PROP(serialize(uint8))
  declare stencilZPass: THREE.StencilOp;

  @PROP(serialize(uint8))
  declare thickness: number;

  @PROP(serialize(ref))
  declare thicknessMap: THREE.Texture | null;

  @PROP(serialize(boolean))
  declare toneMapped: boolean;

  @PROP(serialize(uint32))
  declare transmission: number;

  @PROP(serialize(ref))
  declare transmissionMap: THREE.Texture | null;

  @PROP(serialize(boolean))
  declare transparent: boolean;

  @PROP(serialize(uint32))
  declare version: number;

  @PROP(serialize(boolean))
  declare vertexColors: boolean;

  @PROP(serialize(boolean))
  declare visible: boolean;

  @PROP(serialize(boolean))
  declare wireframe: boolean;

  @PROP(serialize(float32))
  declare wireframeLinewidth: number;

  @PROP(serialize(string, 6))
  declare wireframeLinecap: 'butt' | 'round' | 'square';

  @PROP(serialize(string, 5))
  declare wireframeLinejoin: 'round' | 'bevel' | 'miter';

  constructor(params?: MeshPhysicalMaterialParameters) {
    super(params);

    this.color = new Color(params?.color);
    this.emissive = new Color(params?.emissive ?? 0x000000);
    this.sheenColor = new Color(0x000000);
    this.attenuationColor = new Color(1, 1, 1);
    this.specularColor = new Color(1, 1, 1);
  }

  public tick(): void {}

  public getProxyArgs(): [MeshPhysicalMaterialProxyArgs] {
    return [
      {
        anisotropy: this.anisotropy,
        anisotropyRotation: this.anisotropyRotation,
        aoMapIntensity: this.aoMapIntensity,
        attenuationDistance: this.attenuationDistance,
        bumpScale: this.bumpScale,
        clearcoat: this.clearcoat,
        clearcoatRoughness: this.clearcoatRoughness,
        clearcoatNormalScale: this.clearcoatNormalScale.toArray(),
        displacementBias: this.displacementBias,
        displacementScale: this.displacementScale,
        emissiveIntensity: this.emissiveIntensity,
        envMapIntensity: this.envMapIntensity,
        flatShading: this.flatShading,
        fog: this.fog,
        ior: this.ior,
        iridescence: this.iridescence,
        iridescenceIOR: this.iridescenceIOR,
        iridescenceThicknessRange: [...this.iridescenceThicknessRange],
        lightMapIntensity: this.lightMapIntensity,
        metalness: this.metalness,
        name: this.name,
        normalMapType: this.normalMapType,
        normalScale: this.normalScale.toArray(),
        roughness: this.roughness,
        sheen: this.sheen,
        sheenRoughness: this.sheenRoughness,
        specularIntensity: this.specularIntensity,
        thickness: this.thickness,
        transmission: this.transmission,
        uuid: this.uuid,
        wireframe: this.wireframe,
        wireframeLinewidth: this.wireframeLinewidth,
      },
    ];
  }
}
