import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, float32, ref, serialize, string, uint8, uint32 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../../EngineLoop';
import { type Color, type ColorProxy } from '../Color';
import { type RenderWorker } from '../RenderWorker';
import { type Texture, type TextureProxy } from '../textures/Texture';
import { MaterialProxy, type MaterialProxyArgs } from './Material';

export class MeshBasicMaterialProxy extends MaterialProxy<THREE.MeshBasicMaterial> {
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

  declare clipIntersection: boolean;

  declare clipShadows: boolean;

  declare color: ColorProxy;

  declare colorWrite: boolean;

  declare combine: THREE.Combine;

  declare depthTest: boolean;

  declare dithering: boolean;

  declare envMap: TextureProxy | null;

  declare fog: boolean;

  declare forceSinglePass: boolean;

  declare lightMap: TextureProxy | null;

  declare lightMapIntensity: number;

  declare map: TextureProxy | null;

  declare name: string;

  declare opacity: number;

  declare polygonOffset: boolean;

  declare polygonOffsetFactor: number;

  declare polygonOffsetUnits: number;

  declare precision: 'highp' | 'mediump' | 'lowp' | null;

  declare premultipliedAlpha: boolean;

  declare reflectivity: number;

  declare refractionRatio: number;

  declare shadowSide: THREE.Side | null;

  declare side: THREE.Side;

  declare specularMap: TextureProxy | null;

  declare stencilFunc: THREE.StencilFunc;

  declare stencilRef: number;

  declare stencilWrite: boolean;

  declare stencilWriteMask: number;

  declare stencilFuncMask: number;

  declare stencilFail: THREE.StencilOp;

  declare stencilZFail: THREE.StencilOp;

  declare stencilZPass: THREE.StencilOp;

  declare toneMapped: boolean;

  declare transparent: boolean;

  declare version: number;

  declare vertexColors: boolean;

  declare visible: boolean;

  declare wireframe: boolean;

  declare wireframeLinewidth: number;

  declare wireframeLinecap: 'butt' | 'round' | 'square';

  declare wireframeLinejoin: 'round' | 'bevel' | 'miter';

  protected override readonly object: THREE.MeshBasicMaterial;

  constructor(
    [params]: [MeshBasicMaterialProxyArgs],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([params], tb, id, thread, renderer);

    this.object = new THREE.MeshBasicMaterial({ color: this.color.get(), ...params });
  }

  public override tick(context: IEngineLoopTickContext): void | Promise<void> {
    super.tick(context);

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
    this.object.clipIntersection = this.clipIntersection;
    this.object.clipShadows = this.clipShadows;

    if (this.color) this.object.color.copy(this.color.get());

    this.object.colorWrite = this.colorWrite;
    this.object.combine = this.combine;
    this.object.depthTest = this.depthTest;
    this.object.dithering = this.dithering;

    if (this.envMap) {
      const texture = this.envMap.get();

      if (this.object.envMap !== texture) {
        this.object.envMap = texture;
      }
    }

    this.object.fog = this.fog;
    this.object.forceSinglePass = this.forceSinglePass;

    if (this.lightMap) {
      const texture = this.lightMap.get();

      if (this.object.lightMap !== texture) {
        this.object.lightMap = texture;
      }
    }

    this.object.lightMapIntensity = this.lightMapIntensity;

    if (this.map) {
      const texture = this.map.get();

      if (this.object.map !== texture) {
        this.object.map = texture;
      }
    }

    this.object.opacity = this.opacity;
    this.object.polygonOffset = this.polygonOffset;
    this.object.polygonOffsetFactor = this.polygonOffsetFactor;
    this.object.polygonOffsetUnits = this.polygonOffsetUnits;
    this.object.precision = (this.precision as string) === 'null' ? null : this.precision;
    this.object.premultipliedAlpha = this.premultipliedAlpha;
    this.object.reflectivity = this.reflectivity;
    this.object.refractionRatio = this.refractionRatio;
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

export interface MeshBasicMaterialParameters extends Omit<THREE.MeshBasicMaterialParameters, 'color'> {
  color?: Color;
}

export interface MeshBasicMaterialProxyArgs extends MaterialProxyArgs {
  aoMapIntensity: number;
  combine: MeshBasicMaterial['combine'];
  fog: boolean;
  lightMapIntensity: number;
  name: string;
  opacity: number;
  reflectivity: number;
  refractionRatio: number;
  uuid: string;
  wireframe: boolean;
  wireframeLinewidth: number;
  wireframeLinecap: string;
  wireframeLinejoin: string;
}

@CLASS(proxy(EProxyThread.Render, MeshBasicMaterialProxy))
export class MeshBasicMaterial extends THREE.MeshBasicMaterial implements IProxyOrigin {
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

  @PROP(serialize(boolean))
  declare clipIntersection: boolean;

  @PROP(serialize(boolean))
  declare clipShadows: boolean;

  @PROP(serialize(ref(true)))
  declare color: Color;

  @PROP(serialize(boolean))
  declare colorWrite: boolean;

  @PROP(serialize(ref))
  declare combine: THREE.Combine;

  @PROP(serialize(boolean))
  declare depthTest: boolean;

  @PROP(serialize(boolean))
  declare dithering: boolean;

  @PROP(serialize(ref))
  declare envMap: Texture | null;

  @PROP(serialize(boolean))
  declare fog: boolean;

  @PROP(serialize(boolean))
  declare forceSinglePass: boolean;

  @PROP(serialize(ref))
  declare lightMap: Texture | null;

  @PROP(serialize(uint8))
  declare lightMapIntensity: number;

  @PROP(serialize(ref))
  declare map: Texture | null;

  @PROP(serialize(string, 50))
  declare name: string;

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
  declare reflectivity: number;

  @PROP(serialize(uint8))
  declare refractionRatio: number;

  @PROP(serialize(uint8))
  declare shadowSide: THREE.Side | null;

  @PROP(serialize(uint8))
  declare side: THREE.Side;

  @PROP(serialize(ref))
  declare specularMap: Texture | null;

  @PROP(serialize(uint8))
  declare stencilFunc: THREE.StencilFunc;

  @PROP(serialize(uint32))
  declare stencilRef: number;

  @PROP(serialize(boolean))
  declare stencilWrite: boolean;

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

  declare userData: Record<string, any>;

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

  constructor(params?: MeshBasicMaterialParameters) {
    super(params);
  }

  public tick(): void {}

  public getProxyArgs(): [MeshBasicMaterialProxyArgs] {
    return [
      {
        aoMapIntensity: this.aoMapIntensity,
        combine: this.combine,
        fog: this.fog,
        lightMapIntensity: this.lightMapIntensity,
        name: this.name,
        opacity: this.opacity,
        reflectivity: this.reflectivity,
        refractionRatio: this.refractionRatio,
        uuid: this.uuid,
        wireframe: this.wireframe,
        wireframeLinewidth: this.wireframeLinewidth,
        wireframeLinecap: this.wireframeLinecap,
        wireframeLinejoin: this.wireframeLinejoin,
      },
    ];
  }
}
