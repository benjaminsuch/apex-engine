import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, float32, ref, serialize, string, uint8, uint32, vec2 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../../EngineLoop';
import { Color, type ColorProxy } from '../Color';
import { type RenderWorker } from '../RenderWorker';
import { type Texture, type TextureProxy } from '../textures/Texture';
import { MaterialProxy, type MaterialProxyArgs } from './Material';

export class MeshStandardMaterialProxy extends MaterialProxy<THREE.MeshStandardMaterial> {
  declare alphaHash: boolean;

  declare alphaMap: TextureProxy | null;

  declare alphaTest: number;

  declare alphaToCoverage: boolean;

  declare aoMap: TextureProxy | null;

  declare aoMapIntensity: number;

  declare blendAlpha: number;

  declare blendDst: THREE.BlendingDstFactor;

  declare blendDstAlpha: number | null;

  declare blendEquation: THREE.BlendingEquation;

  declare blendEquationAlpha: number | null;

  declare blending: THREE.Blending;

  declare blendSrc: THREE.BlendingSrcFactor | THREE.BlendingDstFactor;

  declare blendSrcAlpha: number | null;

  declare bumpMap: TextureProxy | null;

  declare bumpScale: number;

  declare clipIntersection: boolean;

  declare clipShadows: boolean;

  declare color: ColorProxy;

  declare colorWrite: boolean;

  declare depthFunc: THREE.DepthModes;

  declare depthTest: boolean;

  declare displacementMap: TextureProxy | null;

  declare displacementBias: number;

  declare displacementScale: number;

  declare dithering: boolean;

  declare emissive: ColorProxy;

  declare emissiveIntensity: number;

  declare emissiveMap: TextureProxy | null;

  declare envMap: TextureProxy | null;

  declare envMapIntensity: number;

  declare flatShading: boolean;

  declare fog: boolean;

  declare forceSinglePass: boolean;

  declare lightMapIntensity: number;

  declare map: TextureProxy | null;

  declare metalness: number;

  declare metalnessMap: TextureProxy | null;

  declare normalMap: TextureProxy | null;

  declare normalMapType: THREE.NormalMapTypes;

  declare normalScale: THREE.Vector2;

  declare opacity: number;

  declare polygonOffset: boolean;

  declare polygonOffsetFactor: number;

  declare polygonOffsetUnits: number;

  declare precision: 'highp' | 'mediump' | 'lowp' | null;

  declare premultipliedAlpha: boolean;

  declare roughness: number;

  declare roughnessMap: TextureProxy | null;

  declare side: THREE.Side;

  declare stencilWrite: boolean;

  declare stencilFunc: THREE.StencilFunc;

  declare stencilRef: number;

  declare stencilWriteMask: number;

  declare stencilFuncMask: number;

  declare stencilFail: THREE.StencilOp;

  declare stencilZFail: THREE.StencilOp;

  declare stencilZPass: THREE.StencilOp;

  declare shadowSide: THREE.Side | null;

  declare toneMapped: boolean;

  declare transparent: boolean;

  declare version: number;

  declare vertexColors: boolean;

  declare visible: boolean;

  declare wireframe: boolean;

  declare wireframeLinewidth: number;

  declare wireframeLinecap: 'butt' | 'round' | 'square';

  declare wireframeLinejoin: 'round' | 'bevel' | 'miter';

  protected override readonly object: THREE.MeshStandardMaterial;

  constructor([params]: [MeshStandardMaterialProxyArgs], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super([params], tb, id, thread, renderer);

    const { name, normalScale: [normalScaleX, normalScaleY], uuid, ...rest } = params;

    this.object = new THREE.MeshStandardMaterial({ color: this.color.get(), normalScale: new THREE.Vector2(normalScaleX, normalScaleY), ...rest });

    this.object.name = name;
    this.object.uuid = uuid;
  }

  public override tick(tick: IEngineLoopTickContext): void | Promise<void> {
    super.tick(tick);

    this.object.alphaHash = this.alphaHash;
    this.object.alphaTest = this.alphaTest;
    this.object.alphaToCoverage = this.alphaToCoverage;

    if (this.alphaMap) {
      const texture = this.alphaMap.get();

      if (this.object.alphaMap !== texture) {
        this.object.alphaMap = texture;
      }
    }

    if (this.aoMap) {
      const texture = this.aoMap.get();

      if (this.object.aoMap !== texture) {
        this.object.aoMap = texture;
      }
    }

    this.object.aoMapIntensity = this.aoMapIntensity;
    this.object.blendAlpha = this.blendAlpha;
    this.object.blendDst = this.blendDst;
    this.object.blendDstAlpha = this.blendDstAlpha;
    this.object.blendEquation = this.blendEquation;
    this.object.blendEquationAlpha = this.blendEquationAlpha;
    this.object.blending = this.blending;
    this.object.blendSrc = this.blendSrc;
    this.object.blendSrcAlpha = this.blendSrcAlpha;

    if (this.bumpMap) {
      const texture = this.bumpMap.get();

      if (this.object.bumpMap !== texture) {
        this.object.bumpMap = texture;
      }
    }

    this.object.bumpScale = this.bumpScale;
    this.object.clipIntersection = this.clipIntersection;
    this.object.clipShadows = this.clipShadows;

    if (this.color) this.object.color.copy(this.color.get());

    this.object.colorWrite = this.colorWrite;
    this.object.depthFunc = this.depthFunc;
    this.object.depthTest = this.depthTest;

    if (this.displacementMap) {
      const texture = this.displacementMap.get();

      if (this.object.displacementMap !== texture) {
        this.object.displacementMap = texture;
      }
    }

    this.object.displacementBias = this.displacementBias;
    this.object.displacementScale = this.displacementScale;
    this.object.dithering = this.dithering;

    if (this.emissive) this.object.emissive.copy(this.emissive.get());

    if (this.emissiveMap) {
      const texture = this.emissiveMap.get();

      if (this.object.emissiveMap !== texture) {
        this.object.emissiveMap = texture;
      }
    }

    if (this.envMap) {
      const texture = this.envMap.get();

      if (this.object.envMap !== texture) {
        this.object.envMap = texture;
      }
    }

    this.object.envMapIntensity = this.envMapIntensity;
    this.object.flatShading = this.flatShading;
    this.object.fog = this.fog;
    this.object.forceSinglePass = this.forceSinglePass;
    this.object.lightMapIntensity = this.lightMapIntensity;

    if (this.map) {
      const texture = this.map.get();

      if (this.object.map !== texture) {
        this.object.map = texture;
      }
    }

    this.object.metalness = this.metalness;

    if (this.metalnessMap) {
      const texture = this.metalnessMap.get();

      if (this.object.metalnessMap !== texture) {
        this.object.metalnessMap = texture;
      }
    }

    if (this.normalMap) {
      const texture = this.normalMap.get();

      if (this.object.normalMap !== texture) {
        this.object.normalMap = texture;
      }
    }

    this.object.normalMapType = this.normalMapType;
    this.object.normalScale = this.normalScale;
    this.object.opacity = this.opacity;
    this.object.polygonOffset = this.polygonOffset;
    this.object.polygonOffsetFactor = this.polygonOffsetFactor;
    this.object.polygonOffsetUnits = this.polygonOffsetUnits;
    this.object.precision = (this.precision as string) === 'null' ? null : this.precision;
    this.object.premultipliedAlpha = this.premultipliedAlpha;
    this.object.roughness = this.roughness;

    if (this.roughnessMap) {
      const texture = this.roughnessMap.get();

      if (this.object.roughnessMap !== texture) {
        this.object.roughnessMap = texture;
      }
    }

    this.object.side = this.side;
    this.object.stencilWrite = this.stencilWrite;
    this.object.stencilFunc = this.stencilFunc;
    this.object.stencilRef = this.stencilRef;
    this.object.stencilWriteMask = this.stencilWriteMask;
    this.object.stencilFuncMask = this.stencilFuncMask;
    this.object.stencilFail = this.stencilFail;
    this.object.stencilZFail = this.stencilZFail;
    this.object.stencilZPass = this.stencilZPass;
    this.object.shadowSide = this.shadowSide;
    this.object.toneMapped = this.toneMapped;
    this.object.transparent = this.transparent;
    this.object.vertexColors = this.vertexColors;
    this.object.version = this.version;
    this.object.visible = this.visible;
    this.object.wireframe = this.wireframe;
    this.object.wireframeLinewidth = this.wireframeLinewidth;
    this.object.wireframeLinecap = this.wireframeLinecap;
    this.object.wireframeLinejoin = this.wireframeLinejoin;
  }
}

export interface MeshStandardMaterialParameters extends Omit<THREE.MeshStandardMaterialParameters, 'color'> {
  color?: Color;
}

export interface MeshStandardMaterialProxyArgs extends MaterialProxyArgs {
  aoMapIntensity: number;
  bumpScale: number;
  displacementBias: number;
  displacementScale: number;
  emissiveIntensity: number;
  envMapIntensity: number;
  flatShading: boolean;
  fog: boolean;
  lightMapIntensity: number;
  metalness: number;
  normalMapType: MeshStandardMaterial['normalMapType'];
  normalScale: [number, number];
  roughness: number;
  wireframe: boolean;
  wireframeLinewidth: number;
}

@CLASS(proxy(EProxyThread.Render, MeshStandardMaterialProxy))
export class MeshStandardMaterial extends THREE.MeshStandardMaterial implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  @PROP(serialize(boolean))
  declare alphaHash: boolean;

  @PROP(serialize(ref))
  declare alphaMap: Texture | null;

  @PROP(serialize(uint8))
  declare alphaTest: number;

  @PROP(serialize(boolean))
  declare alphaToCoverage: boolean;

  @PROP(serialize(ref))
  declare aoMap: Texture | null;

  @PROP(serialize(float32))
  declare aoMapIntensity: number;

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

  declare name: string;

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
  declare side: THREE.Side;

  @PROP(serialize(uint8))
  declare shadowSide: THREE.Side | null;

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

  @PROP(serialize(boolean))
  declare toneMapped: boolean;

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

  constructor(params?: MeshStandardMaterialParameters) {
    super(params);

    this.color = new Color(params?.color);
    this.emissive = new Color(params?.emissive ?? 0x000000);
  }

  public tick(): void {}

  public getProxyArgs(): [MeshStandardMaterialProxyArgs] {
    return [
      {
        aoMapIntensity: this.aoMapIntensity,
        bumpScale: this.bumpScale,
        displacementBias: this.displacementBias,
        displacementScale: this.displacementScale,
        emissiveIntensity: this.emissiveIntensity,
        envMapIntensity: this.envMapIntensity,
        flatShading: this.flatShading,
        fog: this.fog,
        lightMapIntensity: this.lightMapIntensity,
        metalness: this.metalness,
        name: this.name,
        normalMapType: this.normalMapType,
        normalScale: this.normalScale.toArray(),
        roughness: this.roughness,
        uuid: this.uuid,
        wireframe: this.wireframe,
        wireframeLinewidth: this.wireframeLinewidth,
      },
    ];
  }
}
