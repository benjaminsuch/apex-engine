import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, serialize, string, uint8, uint32 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { RenderProxy } from '../RenderProxy';
import { type RenderWorker } from '../RenderWorker';

export class MaterialProxy<T extends THREE.Material = THREE.Material> extends RenderProxy<T> {
  protected readonly object: T;

  constructor(
    args: never[],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super(args, tb, id, thread, renderer);

    this.object = new THREE.Material() as T;
  }
}

export interface MaterialProxyArgs {
  alphaHash: boolean;
  alphaTest: number;
  alphaToCoverage: boolean;
  blendAlpha: number;
  blendDst: Material['blendDst'];
  blendDstAlpha: Material['blendDstAlpha'];
  blendEquation: Material['blendEquation'];
  blendEquationAlpha: Material['blendEquationAlpha'];
  blending: Material['blending'];
  blendSrc: Material['blendSrc'];
  colorWrite: boolean;
  depthFunc: Material['depthFunc'];
  depthTest: boolean;
  dithering: boolean;
  forceSinglePass: boolean;
  name: string;
  opacity: number;
  polygonOffset: boolean;
  polygonOffsetFactor: number;
  polygonOffsetUnits: number;
  premultipliedAlpha: boolean;
  shadowSide: Material['shadowSide'];
  side: Material['side'];
  stencilFunc: Material['stencilFunc'];
  stencilRef: number;
  stencilWrite: boolean;
  stencilWriteMask: number;
  stencilFuncMask: number;
  stencilFail: Material['stencilFail'];
  stencilZFail: Material['stencilZFail'];
  stencilZPass: Material['stencilZPass'];
  toneMapped: boolean;
  transparent: boolean;
  uuid: string;
  vertexColors: boolean;
}

@CLASS(proxy(EProxyThread.Render, MaterialProxy))
export class Material extends THREE.Material implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  @PROP(serialize(boolean))
  declare alphaHash: boolean;

  @PROP(serialize(uint8))
  declare alphaTest: number;

  @PROP(serialize(boolean))
  declare alphaToCoverage: boolean;

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

  @PROP(serialize(boolean))
  declare colorWrite: boolean;

  @PROP(serialize(uint8))
  declare depthFunc: THREE.DepthModes;

  @PROP(serialize(boolean))
  declare depthTest: boolean;

  @PROP(serialize(boolean))
  declare dithering: boolean;

  @PROP(serialize(boolean))
  declare forceSinglePass: boolean;

  @PROP(serialize(string))
  declare name: string;

  @PROP(serialize(uint8))
  declare opacity: number;

  @PROP(serialize(boolean))
  declare polygonOffset: boolean;

  @PROP(serialize(uint32))
  declare polygonOffsetFactor: number;

  @PROP(serialize(uint32))
  declare polygonOffsetUnits: number;

  @PROP(serialize(string))
  declare precision: 'highp' | 'mediump' | 'lowp' | null;

  @PROP(serialize(boolean))
  declare premultipliedAlpha: boolean;

  @PROP(serialize(uint8))
  declare shadowSide: THREE.Side | null;

  @PROP(serialize(uint8))
  declare side: THREE.Side;

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

  @PROP(serialize(boolean))
  declare vertexColors: boolean;

  @PROP(serialize(boolean))
  declare visible: boolean;

  public tick(): void {}

  public getProxyArgs(): [MaterialProxyArgs] {
    return [
      {
        alphaHash: this.alphaHash,
        alphaTest: this.alphaTest,
        alphaToCoverage: this.alphaToCoverage,
        blendAlpha: this.blendAlpha,
        blendDst: this.blendDst,
        blendDstAlpha: this.blendDstAlpha,
        blendEquation: this.blendEquation,
        blendEquationAlpha: this.blendEquationAlpha,
        blending: this.blending,
        blendSrc: this.blendSrc,
        colorWrite: this.colorWrite,
        depthFunc: this.depthFunc,
        depthTest: this.depthTest,
        dithering: this.dithering,
        forceSinglePass: this.forceSinglePass,
        name: this.name,
        opacity: this.opacity,
        polygonOffset: this.polygonOffset,
        polygonOffsetFactor: this.polygonOffsetFactor,
        polygonOffsetUnits: this.polygonOffsetUnits,
        premultipliedAlpha: this.premultipliedAlpha,
        shadowSide: this.shadowSide,
        side: this.side,
        stencilFunc: this.stencilFunc,
        stencilRef: this.stencilRef,
        stencilWrite: this.stencilWrite,
        stencilWriteMask: this.stencilWriteMask,
        stencilFuncMask: this.stencilFuncMask,
        stencilFail: this.stencilFail,
        stencilZFail: this.stencilZFail,
        stencilZPass: this.stencilZPass,
        toneMapped: this.toneMapped,
        transparent: this.transparent,
        uuid: this.uuid,
        vertexColors: this.vertexColors,
      },
    ];
  }
}
