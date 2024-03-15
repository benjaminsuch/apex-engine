import * as THREE from 'three';

import { CLASS, PROP } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { boolean, mat3, ref, serialize, string, uint8, uint16, uint32, vec2 } from '../../core/class/specifiers/serialize';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../../EngineLoop';
import { RenderProxy } from '../RenderProxy';
import { type RenderWorker } from '../RenderWorker';
import { Source, type SourceProxy } from './Source';

export class TextureProxy extends RenderProxy<THREE.Texture> {
  declare anisotropy: Texture['anisotropy'];

  declare center: [number, number];

  declare channel: Texture['channel'];

  declare colorSpace: Texture['colorSpace'];

  declare flipY: Texture['flipY'];

  declare format: Texture['format'];

  declare generateMipmaps: Texture['generateMipmaps'];

  declare internalFormat: Texture['internalFormat'];

  declare magFilter: Texture['magFilter'];

  declare mapping: Texture['mapping'];

  declare matrix: number[];

  declare matrixAutoUpdate: Texture['matrixAutoUpdate'];

  declare minFilter: Texture['minFilter'];

  declare name: Texture['name'];

  declare offset: [number, number];

  declare premultiplyAlpha: Texture['premultiplyAlpha'];

  declare repeat: [number, number];

  declare rotation: Texture['rotation'];

  declare source: SourceProxy;

  declare type: Texture['type'];

  declare unpackAlignment: Texture['unpackAlignment'];

  declare version: Texture['version'];

  declare wrapS: Texture['wrapS'];

  declare wrapT: Texture['wrapT'];

  protected readonly object: THREE.Texture;

  constructor([params]: [TextureProxyArgs], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super([], tb, id, thread, renderer);

    const { uuid, name, mapping, rotation, wrap: [wrapS, wrapT], format, type, colorSpace, minFilter, magFilter, anisotropy } = params;

    this.object = new THREE.Texture(this.source.get().data, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, colorSpace);

    this.object.name = name;
    this.object.uuid = uuid;
  }

  public override tick(tick: IEngineLoopTickContext): void | Promise<void> {
    super.tick(tick);

    this.object.anisotropy = this.anisotropy;
    this.object.center.fromArray(this.center);
    this.object.channel = this.channel;
    this.object.colorSpace = this.colorSpace;
    this.object.flipY = this.flipY;
    this.object.format = this.format;
    this.object.generateMipmaps = this.generateMipmaps;
    this.object.internalFormat = this.internalFormat;
    this.object.magFilter = this.magFilter;
    this.object.mapping = this.mapping;
    this.object.matrix.fromArray(this.matrix);
    this.object.matrixAutoUpdate = this.matrixAutoUpdate;
    this.object.minFilter = this.minFilter;
    this.object.offset.fromArray(this.offset);
    this.object.premultiplyAlpha = this.premultiplyAlpha;
    this.object.repeat.fromArray(this.repeat);
    this.object.rotation = this.rotation;
    this.object.type = this.type;
    this.object.unpackAlignment = this.unpackAlignment;
    this.object.version = this.version;
    this.object.wrapS = this.wrapS;
    this.object.wrapT = this.wrapT;
  }
}

export interface TextureProxyArgs {
  anisotropy: number;
  colorSpace: Texture['colorSpace'];
  format: Texture['format'];
  magFilter: Texture['magFilter'];
  mapping: Texture['mapping'];
  minFilter: Texture['minFilter'];
  name: string;
  rotation: number;
  type: Texture['type'];
  uuid: string;
  wrap: [Texture['wrapS'], Texture['wrapT']];
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

  @PROP(serialize(uint32))
  declare version: number;

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

  public getProxyArgs(): [TextureProxyArgs] {
    return [
      {
        anisotropy: this.anisotropy,
        colorSpace: this.colorSpace,
        format: this.format,
        magFilter: this.magFilter,
        mapping: this.mapping,
        name: this.name,
        minFilter: this.minFilter,
        rotation: this.rotation,
        type: this.type,
        uuid: this.uuid,
        wrap: [this.wrapS, this.wrapT],
      },
    ];
  }
}
