import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, proxy } from '../../core/class/specifiers/proxy';
import { boolean, serialize, string, uint8, uint32 } from '../../core/class/specifiers/serialize';
import { RenderProxy } from '../RenderProxy';

export class MaterialProxy extends RenderProxy {}

@CLASS(proxy(EProxyThread.Render, MaterialProxy))
export class Material extends THREE.Material {
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

  @PROP(serialize(string))
  declare name: string;

  @PROP(serialize(boolean))
  declare needsUpdate: boolean;

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

  @PROP(serialize(boolean))
  declare forceSinglePass: boolean;

  @PROP(serialize(boolean))
  declare dithering: boolean;

  @PROP(serialize(uint8))
  declare side: THREE.Side;

  @PROP(serialize(uint8))
  declare shadowSide: THREE.Side | null;

  @PROP(serialize(boolean))
  declare toneMapped: boolean;

  @PROP(serialize(boolean))
  declare transparent: boolean;

  @PROP(serialize(boolean))
  declare vertexColors: boolean;

  @PROP(serialize(boolean))
  declare visible: boolean;
}