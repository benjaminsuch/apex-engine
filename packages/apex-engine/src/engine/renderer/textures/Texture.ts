import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, mat3, ref, serialize, string, uint8, uint16, uint32, vec2 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { RenderProxy } from '../RenderProxy';
import { type RenderWorker } from '../RenderWorker';
import { Source, type SourceProxy } from './Source';

export class TextureProxy extends RenderProxy {
  declare name: Texture['name'];

  declare source: SourceProxy;

  declare mapping: Texture['mapping'];

  declare channel: Texture['channel'];

  declare wrapS: Texture['wrapS'];

  declare wrapT: Texture['wrapT'];

  declare magFilter: Texture['magFilter'];

  declare minFilter: Texture['minFilter'];

  declare anisotropy: Texture['anisotropy'];

  declare format: Texture['format'];

  declare type: Texture['type'];

  declare internalFormat: Texture['internalFormat'];

  declare matrix: Texture['matrix'];

  declare matrixAutoUpdate: Texture['matrixAutoUpdate'];

  declare offset: Texture['offset'];

  declare repeat: Texture['repeat'];

  declare center: Texture['center'];

  declare rotation: Texture['rotation'];

  declare generateMipmaps: Texture['generateMipmaps'];

  declare premultiplyAlpha: Texture['premultiplyAlpha'];

  declare flipY: Texture['flipY'];

  declare unpackAlignment: Texture['unpackAlignment'];

  declare colorSpace: Texture['colorSpace'];

  public readonly texture: THREE.Texture;

  constructor(args: unknown[] = [], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super(args, tb, id, thread, renderer);

    this.texture = new THREE.Texture(this.source.data, this.mapping, this.wrapS, this.wrapT, this.magFilter, this.minFilter, this.format, this.type, this.anisotropy, this.colorSpace);
  }
}

@CLASS(proxy(EProxyThread.Render, TextureProxy))
export class Texture extends THREE.Texture implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  @PROP(serialize(ref(true)))
  declare source: Source;

  @PROP(serialize(uint16))
  declare mapping: THREE.Mapping;

  @PROP(serialize(uint32))
  declare channel: number;

  @PROP(serialize(uint16))
  declare wrapS: THREE.Wrapping;

  @PROP(serialize(uint16))
  declare wrapT: THREE.Wrapping;

  @PROP(serialize(uint16))
  declare magFilter: THREE.MagnificationTextureFilter;

  @PROP(serialize(uint16))
  declare minFilter: THREE.MinificationTextureFilter;

  @PROP(serialize(uint16))
  declare anisotropy: number;

  @PROP(serialize(uint16))
  declare format: THREE.PixelFormat;

  @PROP(serialize(uint16))
  declare type: THREE.TextureDataType;

  @PROP(serialize(string, 18))
  declare internalFormat: THREE.PixelFormatGPU | null;

  @PROP(serialize(mat3))
  declare matrix: THREE.Matrix3;

  @PROP(serialize(boolean))
  declare matrixAutoUpdate: boolean;

  @PROP(serialize(vec2))
  declare offset: THREE.Vector2;

  @PROP(serialize(vec2))
  declare repeat: THREE.Vector2;

  @PROP(serialize(vec2))
  declare center: THREE.Vector2;

  @PROP(serialize(uint8))
  declare rotation: number;

  @PROP(serialize(boolean))
  declare generateMipmaps: boolean;

  @PROP(serialize(boolean))
  declare premultiplyAlpha: boolean;

  @PROP(serialize(boolean))
  declare flipY: boolean;

  @PROP(serialize(uint8))
  declare unpackAlignment: number;

  @PROP(serialize(string, 17))
  declare colorSpace: THREE.ColorSpace;

  constructor(
    image: ImageBitmap | OffscreenCanvas = Texture.DEFAULT_IMAGE,
    mapping: THREE.Mapping = Texture.DEFAULT_MAPPING,
    wrapS: THREE.Wrapping = THREE.ClampToEdgeWrapping,
    wrapT: THREE.Wrapping = THREE.ClampToEdgeWrapping,
    magFilter: THREE.MagnificationTextureFilter = THREE.LinearFilter,
    minFilter: THREE.MinificationTextureFilter = THREE.LinearMipmapLinearFilter,
    format: THREE.PixelFormat = THREE.RGBAFormat,
    type: THREE.TextureDataType = THREE.UnsignedByteType,
    anisotropy: number = Texture.DEFAULT_ANISOTROPY,
    colorSpace: THREE.ColorSpace = THREE.NoColorSpace
  ) {
    super(image, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);

    this.source = new Source(image);
  }

  public tick(): void {}

  public getProxyArgs(): [] {
    return [];
  }
}
