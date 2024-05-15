// The code below is based on:
//
// https://github.com/pmndrs/three-stdlib/blob/main/src/loaders/GLTFLoader.js
//
// and is licensed under the MIT license.

import { AnimationClip, Box3, BufferAttribute, ClampToEdgeWrapping, DoubleSide, FrontSide, ImageBitmapLoader, InterleavedBuffer, InterleavedBufferAttribute, InterpolateDiscrete, InterpolateLinear, LinearFilter, LinearMipmapLinearFilter, LinearMipmapNearestFilter, LinearSRGBColorSpace, Loader, LoaderUtils, type LoadingManager, Matrix4, MirroredRepeatWrapping, NearestFilter, NearestMipmapLinearFilter, NearestMipmapNearestFilter, NumberKeyframeTrack, QuaternionKeyframeTrack, RepeatWrapping, Sphere, TextureLoader, Vector2, Vector3, VectorKeyframeTrack } from 'three';
import { DRACOLoader, type GLTF, type KTX2Loader } from 'three-stdlib';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { Actor } from './Actor';
import { FileLoader } from './FileLoader';
import { type Level } from './Level';
import { Bone } from './renderer/Bone';
import { Color } from './renderer/Color';
import { BufferGeometry } from './renderer/geometries/BufferGeometry';
import { type Material } from './renderer/materials/Material';
import { MeshBasicMaterial, type MeshBasicMaterialParameters } from './renderer/materials/MeshBasicMaterial';
import { MeshPhysicalMaterial } from './renderer/materials/MeshPhysicalMaterial';
import { MeshStandardMaterial, type MeshStandardMaterialParameters } from './renderer/materials/MeshStandardMaterial';
import { MeshComponent } from './renderer/MeshComponent';
import { SceneComponent } from './renderer/SceneComponent';
import { Skeleton } from './renderer/Skeleton';
import { SkinnedMeshComponent } from './renderer/SkinnedMeshComponent';
import { Texture } from './renderer/textures/Texture';

const EXTENSIONS = {
  KHR_BINARY_GLTF: 'KHR_binary_glTF',
  KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
  KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
  KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
  KHR_MATERIALS_IOR: 'KHR_materials_ior',
  KHR_MATERIALS_SHEEN: 'KHR_materials_sheen',
  KHR_MATERIALS_SPECULAR: 'KHR_materials_specular',
  KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
  KHR_MATERIALS_IRIDESCENCE: 'KHR_materials_iridescence',
  KHR_MATERIALS_ANISOTROPY: 'KHR_materials_anisotropy',
  KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
  KHR_MATERIALS_VOLUME: 'KHR_materials_volume',
  KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
  KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
  KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
  KHR_MATERIALS_EMISSIVE_STRENGTH: 'KHR_materials_emissive_strength',
  EXT_TEXTURE_WEBP: 'EXT_texture_webp',
  EXT_TEXTURE_AVIF: 'EXT_texture_avif',
  EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression',
  EXT_MESH_GPU_INSTANCING: 'EXT_mesh_gpu_instancing',
} as const;

const WEBGL_CONSTANTS = {
  FLOAT: 5126,
  FLOAT_MAT3: 35675,
  FLOAT_MAT4: 35676,
  FLOAT_VEC2: 35664,
  FLOAT_VEC3: 35665,
  FLOAT_VEC4: 35666,
  LINEAR: 9729,
  REPEAT: 10497,
  SAMPLER_2D: 35678,
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6,
  UNSIGNED_BYTE: 5121,
  UNSIGNED_SHORT: 5123,
} as const;

const WEBGL_COMPONENT_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
} as const;

const WEBGL_FILTERS = {
  9728: NearestFilter,
  9729: LinearFilter,
  9984: NearestMipmapNearestFilter,
  9985: LinearMipmapNearestFilter,
  9986: NearestMipmapLinearFilter,
  9987: LinearMipmapLinearFilter,
} as const;

const WEBGL_WRAPPINGS = {
  33071: ClampToEdgeWrapping,
  33648: MirroredRepeatWrapping,
  10497: RepeatWrapping,
} as const;

const WEBGL_TYPE_SIZES = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
} as const;

const ATTRIBUTES = {
  POSITION: 'position',
  NORMAL: 'normal',
  TANGENT: 'tangent',
  TEXCOORD_0: 'uv',
  TEXCOORD_1: 'uv1',
  TEXCOORD_2: 'uv2',
  TEXCOORD_3: 'uv3',
  COLOR_0: 'color',
  WEIGHTS_0: 'skinWeight',
  JOINTS_0: 'skinIndex',
} as const;

const PATH_PROPERTIES = {
  scale: 'scale',
  translation: 'position',
  rotation: 'quaternion',
  weights: 'morphTargetInfluences',
} as const;

const INTERPOLATION = {
  CUBICSPLINE: undefined,
  LINEAR: InterpolateLinear,
  STEP: InterpolateDiscrete,
} as const;

const ALPHA_MODES = {
  OPAQUE: 'OPAQUE',
  MASK: 'MASK',
  BLEND: 'BLEND',
} as const;

export interface GLTFLoaderExtension {
  name: string;
  beforeRoot?: () => Promise<void>;
  afterRoot?: (result: GLTF) => Promise<void>;
  loadAnimation?: (index: number) => Promise<AnimationClip | undefined>;
  loadNode?: (nodeIndex: number) => Promise<SceneComponent | null>;
  loadMesh?: (meshIndex: number) => Promise<MeshComponent | SkinnedMeshComponent | null>;
  loadBufferView?: (bufferViewIndex: number) => Promise<ArrayBuffer | null>;
  loadMaterial?: (materialIndex: number) => Promise<Material | null>;
  loadTexture?: (textureIndex: number) => Promise<Texture | null>;
  getMaterialType?: (materialIndex: number) => typeof Material | null;
  extendMaterialParams?: (materialIndex: number, materialParams: { [key: string]: any }) => Promise<any>;
  createNodeMesh?: (nodeIndex: number) => Promise<MeshComponent | SkinnedMeshComponent | null>;
  createNodeAttachment?: (nodeIndex: number) => Promise<SceneComponent | null>;
}

export type GLTFLoaderOnProgressHandler = (event: ProgressEvent) => void;

export type GLTFLoaderExtensionCallback = (parser: GLTFParser) => GLTFLoaderExtension;

export class GLTFLoader extends Loader {
  private readonly extensionCallbacks: GLTFLoaderExtensionCallback[] = [];

  private readonly extensions: { [prop: string]: GLTFLoaderExtension } = {};

  public dracoLoader: DRACOLoader;

  public ktx2Loader: KTX2Loader | null = null;

  public meshoptDecoder: any = null;

  constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {
    super();

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.dracoLoader.setDecoderConfig({ type: 'js' });

    this.registerExtensions();
  }

  public override loadAsync(url: string, onProgress?: GLTFLoaderOnProgressHandler): Promise<GLTFParsedFile> {
    return super.loadAsync(url, onProgress) as Promise<GLTFParsedFile>;
  }

  public override load(url: string, onLoad: GLTFParserOnLoadHandler, onProgress?: GLTFLoaderOnProgressHandler, onError?: GLTFParserOnErrorHandler): void {
    const self = this;
    let resourcePath: string;

    if (this.resourcePath !== '') {
      resourcePath = this.resourcePath;
    } else if (this.path !== '') {
      resourcePath = this.path;
    } else {
      resourcePath = LoaderUtils.extractUrlBase(url);
    }

    this.manager.itemStart(url);

    function onErrorHandler(error: any): void {
      if (onError) {
        onError(error);
      } else {
        console.error(error);
      }

      self.manager.itemError(url);
      self.manager.itemEnd(url);
    }

    const loader = this.instantiationService.createInstance(FileLoader, this.manager);
    loader.responseType = 'arraybuffer';
    loader.setPath(this.path);
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);

    function onLoadHandler(data: string | ArrayBuffer): void {
      try {
        self.parse(
          data,
          resourcePath,
          (gltf) => {
            onLoad(gltf);
            self.manager.itemEnd(url);
          },
          onErrorHandler
        );
      } catch (error) {
        onErrorHandler(error);
      }
    }

    loader.load(url, onLoadHandler, onProgress, onErrorHandler);
  }

  public parse(data: string | ArrayBuffer, path: string, onLoad: GLTFParserOnLoadHandler, onError: GLTFParserOnErrorHandler): void {
    const json = this.readData(data);
    console.log('loaded gltf json:', path);
    console.log(json);
    const parser = this.instantiationService.createInstance(GLTFParser, json, {
      // extensions: this.extensions,
      path,
      crossOrigin: this.crossOrigin,
      requestHeader: this.requestHeader,
      manager: this.manager,
      ktx2Loader: this.ktx2Loader,
      meshoptDecoder: this.meshoptDecoder,
    });

    if (json.extensionsUsed) {
      for (let i = 0; i < json.extensionsUsed.length; ++i) {
        const extensionName = json.extensionsUsed[i];
        const extensionsRequired = json.extensionsRequired ?? [];

        switch (extensionName) {
          case EXTENSIONS.KHR_MATERIALS_UNLIT:
            this.extensions[extensionName] = new GLTFMaterialsUnlitExtension();
            break;
          case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
            this.extensions[extensionName] = new GLTFDracoMeshCompressionExtension(json, this.dracoLoader);
            break;
          case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
            this.extensions[extensionName] = new GLTFTextureTransformExtension();
            break;
          case EXTENSIONS.KHR_MESH_QUANTIZATION:
            this.extensions[extensionName] = new GLTFMeshQuantizationExtension();
            break;
          default:
            if (extensionsRequired.indexOf(extensionName) >= 0 && !this.extensions[extensionName]) {
              console.warn('THREE.GLTFLoader: Unknown extension "' + extensionName + '".');
            }
        }
      }
    }

    parser.extensions = this.extensions;
    parser.parse(onLoad, onError);
  }

  public async parseAsync(data: string | ArrayBuffer, path: string): Promise<GLTFParsedFile> {
    return new Promise((resolve, reject) => this.parse(data, path, resolve, reject));
  }

  protected readData(data: string | ArrayBuffer): GLTFFileContent {
    let json: GLTFFileContent | undefined;

    if (typeof data === 'string') {
      json = JSON.parse(data);
    }

    if (data instanceof ArrayBuffer) {
      const magic = LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4)));

      if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
        const binaryExtension = new GLTFBinaryExtension(data);
        this.extensions[binaryExtension.name] = binaryExtension;
        json = JSON.parse(binaryExtension.content);
      } else {
        json = JSON.parse(LoaderUtils.decodeText(new Uint8Array(data)));
      }
    }

    if (!json) {
      throw new Error(`Empty json: Make sure 'data' is of type string or ArrayBuffer.`);
    }

    if (json.asset && Number(json.asset.version[0]) < 2) {
      throw new Error('THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.');
    }

    return json;
  }

  protected registerExtensions(): void {
    this.extensionCallbacks.push(
      parser => new GLTFMaterialsClearcoatExtension(parser),
      parser => new GLTFTextureBasisUExtension(parser),
      parser => new GLTFTextureWebPExtension(parser),
      parser => new GLTFTextureAVIFExtension(parser),
      parser => new GLTFMaterialsSheenExtension(parser),
      parser => new GLTFMaterialsTransmissionExtension(parser),
      parser => new GLTFMaterialsVolumeExtension(parser),
      parser => new GLTFMaterialsIorExtension(parser),
      parser => new GLTFMaterialsEmissiveStrengthExtension(parser),
      parser => new GLTFMaterialsSpecularExtension(parser),
      parser => new GLTFMaterialsIridescenceExtension(parser),
      parser => new GLTFMaterialsAnisotropyExtension(parser),
      // parser => new GLTFLightsExtension(parser),
      parser => new GLTFMeshoptCompression(parser),
      // parser => new GLTFMeshGpuInstancing(parser),
    );
  }
}

export interface GLTFObject {
  extensions?: Record<string, any>;
  name?: string;
  extras?: Record<string, any>;
}

export interface GLTFAccessor extends GLTFObject {
  bufferView: number;
  byteOffset?: number;
  byteStride?: any;
  componentType: keyof typeof WEBGL_COMPONENT_TYPES;
  count: number;
  max: number[];
  min: number[];
  normalized?: boolean;
  sparse?: {
    count: number;
    indices: {
      bufferView: number;
      byteOffset: number;
      componentType: keyof typeof WEBGL_COMPONENT_TYPES;
    };
    values: {
      bufferView: number;
      byteOffset: number;
    };
  };
  type: keyof typeof WEBGL_TYPE_SIZES;
}

export interface GLTFAnimation extends GLTFObject {
  channels: any[];
  parameters?: any[];
  samplers: any[];
}

export interface GLTFAsset {
  generator: string;
  version: string;
}

export interface GLTFBufferView extends GLTFObject {
  buffer: number;
  byteLength: number;
  byteOffset: number;
  byteStride?: any;
  target: number;
}

export interface GLTFBuffer extends GLTFObject {
  byteLength: number;
  type?: string;
  uri?: string;
}

export interface GLTFImage extends GLTFObject {
  bufferView: number;
  mimeType: string;
  uri?: string;
}

export interface GLTFMaterialTexture {
  index: number;
  scale?: number;
  strength?: number;
  texCoord: number;
}

export interface GLTFMaterial extends GLTFObject {
  alphaCutoff?: number;
  alphaMode?: string;
  doubleSided: boolean;
  emissiveFactor: number[];
  emissiveTexture?: GLTFMaterialTexture;
  normalTexture?: GLTFMaterialTexture;
  occlusionTexture?: GLTFMaterialTexture;
  pbrMetallicRoughness: {
    baseColorFactor?: number[];
    baseColorTexture?: GLTFMaterialTexture;
    metallicFactor?: number;
    metallicRoughnessFactor?: number;
    metallicRoughnessTexture?: GLTFMaterialTexture;
    roughnessFactor?: number;
  };
}

export interface GLTFPrimitive extends GLTFObject {
  attributes: {
    COLOR_0: number;
    JOINTS_0: number;
    NORMAL: number;
    POSITION: number;
    TANGENT: number;
    TEXCOORD_0: number;
    TEXCOORD_1: number;
    TEXCOORD_2: number;
    TEXCOORD_3: number;
    WEIGHTS_0: number;
  };
  indices: number;
  material: number;
  mode: number;
  targets?: Record<string, number>[];
}

export interface GLTFMesh extends GLTFObject {
  primitives: GLTFPrimitive[];
  weights?: number[];
  isSkinnedMesh?: boolean;
}

export interface GLTFNode extends GLTFObject {
  camera?: number;
  children?: number[];
  isBone?: boolean;
  matrix: number[];
  mesh?: number;
  rotation?: [number, number, number];
  scale?: [number, number, number];
  translation?: [number, number, number];
  skin?: number;
}

export interface GLTFSampler extends GLTFObject {
  magFilter: number;
  minFilter: number;
  wrapS: number;
  wrapT: number;
}

export interface GLTFScene extends GLTFObject {
  nodes: number[];
}

export interface GLTFSkin extends GLTFObject {
  inverseBindMatrices: number;
  joints: number[];
}

export interface GLTFTexture extends GLTFObject {
  sampler: number;
  source: number;
}

export interface GLTFCamera extends GLTFObject {
  orthographic?: {
    xmag: number;
    ymag: number;
    zfar: number;
    znear: number;
  };
  perspective?: {
    aspectRatio?: number;
    yfov: number;
    zfar?: number;
    znear: number;
  };
  type: 'orthographic' | 'perspective';
}

export interface GLTFFileContent {
  accessors: GLTFAccessor[];
  animations: GLTFAnimation[];
  asset: GLTFAsset;
  bufferViews: GLTFBufferView[];
  buffers: GLTFBuffer[];
  cameras: GLTFCamera[];
  extensionsRequired?: string[];
  extensionsUsed?: string[];
  images: GLTFImage[];
  materials: GLTFMaterial[];
  meshes: GLTFMesh[];
  nodes: GLTFNode[];
  samplers: GLTFSampler[];
  scene: number;
  scenes: GLTFScene[];
  skins: GLTFSkin[];
  textures: GLTFTexture[];
}

export interface GLTFParserOptions {
  // extensions: string[];
  path: string;
  manager: LoadingManager;
  ktx2Loader: KTX2Loader | null;
  meshoptDecoder: any;
  crossOrigin: string;
  requestHeader: { [header: string]: string };
}

export interface GLTFParsedFile {
  scene: GLTFParserRegisterActorCallback[];
  animations: GLTFParserRegisterComponentCallback[];
}

/**
 * Spawns a new actor if an existing `actor` is not provided and registers all it's components.
 */
export type GLTFParserRegisterActorCallback = (level: Level, actor?: Actor) => Promise<Actor>;

export type GLTFParserOnLoadHandler = (gltf: GLTFParsedFile) => void;

export type GLTFParserOnErrorHandler = (event: ErrorEvent) => void;

export type GLTFParserRegisterComponentCallback = (actor: Actor, parent?: SceneComponent) => Promise<SceneComponent>;

export class GLTFParser {
  private readonly textureCache: Record<string, Promise<Texture | null>> = {};

  private readonly sourceCache: Record<number, Promise<Texture>> = {};

  private readonly associations: Map<any, any> = new Map();

  public readonly cache: Map<string, any> = new Map();

  public readonly textureLoader: TextureLoader | ImageBitmapLoader;

  public readonly fileLoader: FileLoader;

  public extensions: GLTFLoader['extensions'] = {};

  public readonly name: string = 'GLTFParser';

  constructor(
    public readonly data: GLTFFileContent,
    public readonly options: GLTFParserOptions,
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.textureLoader = this.createTextureLoader();
    this.textureLoader.setCrossOrigin(this.options.crossOrigin);
    this.textureLoader.setRequestHeader(this.options.requestHeader);

    this.fileLoader = this.instantiationService.createInstance(FileLoader, this.options.manager);
    this.fileLoader.responseType = 'arraybuffer';
    this.fileLoader.setRequestHeader(this.options.requestHeader);

    if (this.options.crossOrigin === 'use-credentials') {
      this.fileLoader.setWithCredentials(true);
    }
  }

  public parse(onLoad: GLTFParserOnLoadHandler, onError?: GLTFParserOnErrorHandler): void {
    const { animations = [], meshes = [], nodes = [], skins = [] } = this.data;

    for (let i = 0; i < skins.length; ++i) {
      const joints = skins[i].joints;

      for (let j = 0; j < joints.length; ++j) {
        this.data.nodes[joints[j]].isBone = true;
      }
    }

    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];

      if (node.mesh !== undefined && node.skin !== undefined) {
        meshes[node.mesh].isSkinnedMesh = true;
      }
    }

    Promise.all([this.loadScene(0), Promise.all(animations.map(async (_, index) => this.loadAnimation(index)))])
      .then(([scene, animations]) => onLoad({ scene, animations }))
      .catch(onError);
  }

  public invokeOne(func: Function): any {
    const extensions = Object.values(this.extensions);
    extensions.push(this as any);

    let result: unknown;

    for (let i = 0; i < extensions.length; i++) {
      result = func(extensions[i]);
      if (result) return result;
    }

    return null;
  }

  public invokeAll(func: Function): any {
    const extensions = Object.values(this.extensions);
    extensions.unshift(this as any);

    const pending = [];

    for (let i = 0; i < extensions.length; i++) {
      const result = func(extensions[i]);
      if (result) pending.push(result);
    }

    return pending;
  }

  public async getDependency(type: string, index: number): Promise<any> {
    const cacheKey = type + ':' + index;
    let dependency = this.cache.get(cacheKey);

    if (type === 'mesh') return this.loadMesh(index);
    if (type === 'node') return this.loadNode(index);
    if (type === 'skin') return this.loadSkin(index);

    if (!dependency) {
      switch (type) {
        case 'accessor':
          dependency = await this.loadAccessor(index);
          break;
        case 'animation':
          dependency = await this.invokeOne((ext: GLTFLoaderExtension) => ext.loadAnimation?.(index));
          break;
        case 'buffer':
          dependency = await this.loadBuffer(index);
          break;
        case 'bufferView':
          dependency = await this.loadBufferView(index);
          break;
        case 'camera':
          dependency = await this.loadCamera(index);
          break;
        case 'material':
          dependency = await this.invokeOne((ext: GLTFLoaderExtension) => ext.loadMaterial?.(index));
          break;
        case 'scene':
          dependency = await this.loadScene(index);
          break;
        case 'texture':
          dependency = await this.invokeOne((ext: GLTFLoaderExtension) => ext.loadTexture?.(index));
          break;
      }

      if (dependency) {
        this.cache.set(cacheKey, dependency);
      }
    }

    return dependency;
  }

  public async loadScene(index: number): Promise<GLTFParserRegisterActorCallback[]> {
    const { nodes = [] } = this.data.scenes[index];
    const callbacks: GLTFParserRegisterActorCallback[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const registerComponent = await this.getDependency('node', nodes[i]);

      callbacks.push(async (level, actor: Actor = level.getWorld().spawnActor(Actor)) => {
        await registerComponent(actor, actor.rootComponent);
        return actor;
      });
    }

    return callbacks;
  }

  public async loadTexture(index: number): Promise<any> {
    const textureDef = this.data.textures[index];
    const sourceDef = this.data.images[textureDef.source];

    let loader: Loader = this.textureLoader;

    if (sourceDef.uri) {
      const handler = this.options.manager.getHandler(sourceDef.uri);

      if (handler !== null) {
        loader = handler;
      }
    }

    return this.loadTextureImage(index, textureDef.source, loader) as Promise<Texture>;
  }

  public async loadTextureImage(textureIndex: number, sourceIndex: number, loader: Loader): Promise<Texture | null> {
    const { images, samplers = {}, textures } = this.data;
    const textureDef = textures[textureIndex];
    const sourceDef = images[sourceIndex];
    const cacheKey = (sourceDef.uri ?? sourceDef.bufferView) + ':' + textureDef.sampler;

    if (cacheKey in this.textureCache) {
      return this.textureCache[cacheKey];
    }

    const promise = this.loadImageSource(sourceIndex, loader)
      .then((texture) => {
        texture.flipY = false;
        texture.name = textureDef.name ?? sourceDef.name ?? '';

        if (texture.name === '' && typeof sourceDef.uri === 'string' && sourceDef.uri.startsWith('data:image/') === false) {
          texture.name = sourceDef.uri;
        }

        const sampler = (samplers[textureDef.sampler as keyof typeof samplers] ?? {}) as GLTFSampler;

        texture.magFilter = WEBGL_FILTERS[sampler.magFilter as keyof typeof samplers] ?? LinearFilter;
        texture.minFilter = WEBGL_FILTERS[sampler.minFilter as keyof typeof samplers] ?? LinearMipmapLinearFilter;
        texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS as keyof typeof samplers] ?? RepeatWrapping;
        texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT as keyof typeof samplers] ?? RepeatWrapping;

        this.associations.set(texture, { textures: textureIndex });

        return texture;
      })
      .catch(() => null);

    this.textureCache[cacheKey] = promise;

    return promise;
  }

  public async loadImageSource(index: number, loader: Loader): Promise<Texture> {
    const sourceDef = this.data.images[index];

    let isObjectURL = false;

    if (sourceDef.bufferView !== undefined) {
      const bufferView = await this.getDependency('bufferView', sourceDef.bufferView);
      const blob = new Blob([bufferView], { type: sourceDef.mimeType });

      sourceDef.uri = URL.createObjectURL(blob);
      isObjectURL = true;
    }

    if (!sourceDef.uri) {
      throw new Error('THREE.GLTFLoader: Image ' + index + ' is missing URI and bufferView');
    }

    const promise = Promise.resolve(sourceDef.uri)
      .then((uri) => {
        return new Promise<any>((resolve, reject) => {
          let onLoad = resolve;

          if ((loader as any).isImageBitmapLoader === true) {
            onLoad = (imageBitmap: ImageBitmap): void => resolve(this.instantiationService.createInstance(Texture, imageBitmap));
          }

          loader.load(LoaderUtils.resolveURL(uri, this.options.path), onLoad, undefined, reject);
        });
      })
      .then((texture: Texture) => {
        if (isObjectURL) {
          URL.revokeObjectURL(sourceDef.uri!);
        }

        texture.userData.mimeType = sourceDef.mimeType ?? getImageURIMimeType(sourceDef.uri ?? '');

        return texture;
      })
      .catch((error) => {
        console.error('THREE.GLTFLoader: Couldn\'t load texture', sourceDef.uri);
        throw error;
      });

    this.sourceCache[index] = promise;

    return promise;
  }

  public getMaterialType(): typeof MeshStandardMaterial {
    return MeshStandardMaterial;
  }

  public async loadMaterial(index: number): Promise<any> {
    const materialDef = this.data.materials[index];
    const { alphaCutoff = 0.5, alphaMode = ALPHA_MODES.OPAQUE, doubleSided, emissiveFactor, emissiveTexture, extensions = {}, extras, normalTexture, occlusionTexture, pbrMetallicRoughness = {} } = materialDef;
    const pending = [];

    const materialParams: Record<string, any> = {};
    let materialType: typeof MeshBasicMaterial | typeof MeshStandardMaterial;

    if (extensions[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
      // @ts-ignore
      const kmuExtension = this.extensions[EXTENSIONS.KHR_MATERIALS_UNLIT] as GLTFMaterialsUnlitExtension;
      materialType = kmuExtension.getMaterialType();
      pending.push(kmuExtension.extendParams(materialParams, materialDef, this));
    } else {
      const { baseColorFactor, baseColorTexture, metallicFactor = 1, metallicRoughnessTexture, roughnessFactor = 1 } = pbrMetallicRoughness;

      materialParams.color = new Color(1, 1, 1);
      materialParams.opacity = 1;

      if (Array.isArray(baseColorFactor)) {
        materialParams.color.fromArray(baseColorFactor);
        materialParams.opacity = baseColorFactor[3];
      }

      if (baseColorTexture) {
        pending.push(this.assignTexture(materialParams, 'map', baseColorTexture, 3001));
      }

      materialParams.metalness = metallicFactor;
      materialParams.roughness = roughnessFactor;

      if (metallicRoughnessTexture) {
        pending.push(this.assignTexture(materialParams, 'metalnessMap', metallicRoughnessTexture));
        pending.push(this.assignTexture(materialParams, 'roughnessMap', metallicRoughnessTexture));
      }

      materialType = this.invokeOne((ext: GLTFLoaderExtension) => ext.getMaterialType?.(index));

      pending.push(Promise.all(this.invokeAll((ext: GLTFLoaderExtension) => ext.extendMaterialParams?.(index, materialParams))));
    }

    if (doubleSided === true) {
      materialParams.side = DoubleSide;
    }

    if (alphaMode === ALPHA_MODES.BLEND) {
      materialParams.transparent = true;
      materialParams.depthWrite = false;
    } else {
      materialParams.transparent = false;

      if (alphaMode === ALPHA_MODES.MASK) {
        materialParams.alphaTest = alphaCutoff;
      }
    }

    if (normalTexture !== undefined && materialType !== MeshBasicMaterial) {
      pending.push(this.assignTexture(materialParams, 'normalMap', normalTexture));
      materialParams.normalScale = new Vector2(1, 1);

      if (normalTexture.scale !== undefined) {
        const scale = normalTexture.scale;
        materialParams.normalScale.set(scale, scale);
      }
    }

    if (occlusionTexture !== undefined && materialType !== MeshBasicMaterial) {
      pending.push(this.assignTexture(materialParams, 'aoMap', occlusionTexture));

      if (occlusionTexture.strength !== undefined) {
        materialParams.aoMapIntensity = occlusionTexture.strength;
      }
    }

    if (emissiveFactor !== undefined && materialType !== MeshBasicMaterial) {
      materialParams.emissive = new Color().fromArray(emissiveFactor);
    }

    if (emissiveTexture !== undefined && materialType !== MeshBasicMaterial) {
      pending.push(this.assignTexture(materialParams, 'emissiveMap', emissiveTexture, 3001));
    }

    return Promise.all(pending).then(() => {
      const material = this.instantiationService.createInstance(materialType, materialParams);

      if (materialDef.name) {
        material.name = materialDef.name;
      }

      assignExtrasToUserData(material, extras);
      this.associations.set(material, { materials: index });

      if (extensions) {
        addUnknownExtensionsToUserData(this.extensions, material, extensions);
      }

      material.needsUpdate = true;

      return material;
    });
  }

  public assignFinalMaterial(component: MeshComponent): any {
    const material = component.material as MeshStandardMaterial;

    if (component.geometry.attributes.tangent === undefined) {
      material.normalScale.y *= -1;
    }

    material.flatShading = component.geometry.attributes.normal === undefined;
    material.vertexColors = component.geometry.attributes.color !== undefined;
  }

  public async loadCamera(index: number): Promise<any> {

  }

  public async loadGeometries(primitives: GLTFPrimitive[]): Promise<BufferGeometry[]> {
    const self = this;
    const pending = [];

    async function createDracoPrimitive(primitive: GLTFPrimitive): Promise<any> {
      return (self.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION] as GLTFDracoMeshCompressionExtension)
        .decodePrimitive(primitive, self)
        .then((geometry: BufferGeometry) => addPrimitiveAttributes(geometry, primitive, self));
    }

    for (let i = 0; i < primitives.length; i++) {
      const primitive = primitives[i];
      const key = createPrimitiveKey(primitive);
      const cached = this.cache.get(key);

      if (cached) {
        pending.push(cached.promise);
      } else {
        let geometryPromise;

        if (primitive.extensions && primitive.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]) {
          geometryPromise = createDracoPrimitive(primitive);
        } else {
          geometryPromise = addPrimitiveAttributes(new BufferGeometry(), primitive, this);
        }

        this.cache.set(key, { primitive, promise: geometryPromise });
        pending.push(geometryPromise);
      }
    }

    return Promise.all(pending);
  }

  public async loadMesh(index: number): Promise<GLTFParserRegisterComponentCallback[]> {
    const meshDef = this.data.meshes[index];
    const { extras, isSkinnedMesh = false, primitives, name = '' } = meshDef;
    const isBrowser = IS_NODE === false && IS_WORKER === false;
    const pending = [];

    for (let i = 0; i < primitives.length; i++) {
      let material: Promise<Material | null>;

      if (isBrowser) {
        material = primitives[i].material === undefined ? Promise.resolve(createDefaultMaterial(this.cache)) : this.getDependency('material', primitives[i].material);
      } else {
        material = Promise.resolve(null);
      }

      pending.push(material);
    }

    pending.push(this.loadGeometries(primitives));

    return Promise.all(pending).then((results) => {
      const geometries = results.pop() as BufferGeometry[];
      const materials = results as Array<Material | null>;
      const meshRegisterCallbacks: GLTFParserRegisterComponentCallback[] = [];

      for (let i = 0; i < geometries.length; i++) {
        const geometry = geometries[i];
        const primitive = primitives[i];
        const material = materials[i];

        meshRegisterCallbacks.push(async (actor) => {
          const cacheKey = 'mesh:' + index + '_' + i;
          let component: MeshComponent = this.cache.get(cacheKey);

          if (component) return component;

          if (primitive.mode === WEBGL_CONSTANTS.TRIANGLES || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN || primitive.mode === undefined) {
            if (isSkinnedMesh) {
              component = actor.addComponent(SkinnedMeshComponent, geometry, material);
              (component as SkinnedMeshComponent).normalizeSkinWeights();
            } else {
              component = actor.addComponent(MeshComponent, geometry, material);
            }
          } else {
            component = actor.addComponent(MeshComponent, geometry, material);
          }

          if (Object.keys(component.geometry!.morphAttributes).length > 0) {
            updateMorphTargets(component, meshDef);
          }

          assignExtrasToUserData(component, extras);

          if (primitive.extensions) {
            addUnknownExtensionsToUserData(this.extensions, component, primitive.extensions);
          }

          if (isBrowser) {
            this.assignFinalMaterial(component);
          }

          component.name = name + '_' + i;

          this.associations.set(component, { meshes: index, primitives: i });
          this.cache.set(cacheKey, component);

          return component;
        });
      }

      return meshRegisterCallbacks;
    });
  }

  public async loadSkin(index: number): Promise<GLTFParserRegisterComponentCallback> {
    const { inverseBindMatrices, joints } = this.data.skins[index];
    const pending: Promise<GLTFParserRegisterComponentCallback | BufferAttribute | InterleavedBufferAttribute | null>[] = [];

    for (let i = 0; i < joints.length; i++) {
      pending.push(this.loadNodeShallow(joints[i]));
    }

    if (inverseBindMatrices !== undefined) {
      pending.push(this.getDependency('accessor', inverseBindMatrices));
    } else {
      pending.push(Promise.resolve(null));
    }

    return Promise.all(pending).then((results) => {
      const inverseBindMatrices = results.pop() as BufferAttribute | InterleavedBufferAttribute | null;
      const joints = results as GLTFParserRegisterComponentCallback[];

      return async (actor, parent) => {
        const cacheKey = 'skin:' + index;
        const bones: SceneComponent[] = [];
        const boneInverses: Matrix4[] = [];

        let skeleton: Skeleton = this.cache.get(cacheKey);

        if (skeleton) return skeleton;

        for (let i = 0; i < joints.length; i++) {
          const registerComponent = joints[i];
          const component = await registerComponent(actor, parent);

          bones.push(component);

          const mat4 = new Matrix4();

          if (inverseBindMatrices) {
            mat4.fromArray(inverseBindMatrices.array, i * 16);
          }

          boneInverses.push(mat4);
        }

        skeleton = this.instantiationService.createInstance(Skeleton, bones, boneInverses);

        this.cache.set(cacheKey, skeleton);

        // Skeleton is not of type `SceneComponent`, but I can't refactor the code now. Crikey!
        return skeleton as any;
      };
    });
  }

  public async loadNode(index: number): Promise<GLTFParserRegisterComponentCallback> {
    const { children = [], skin } = this.data.nodes[index];

    return async (actor, parent) => {
      const pending: Promise<GLTFParserRegisterComponentCallback>[] = [this.loadNodeShallow(index)];

      for (let i = 0; i < children.length; i++) {
        pending.push(this.getDependency('node', children[i]));
      }

      return Promise.all(pending).then(async ([registerComponent, ...children]) => {
        const component = await registerComponent(actor);

        if (skin !== undefined) {
          const registerSkeleton = await this.getDependency('skin', skin);
          const skeleton = await registerSkeleton(actor, component);
          const skinnedMeshes: SceneComponent[] = [component, ...component.children];

          for (let i = 0; i < skinnedMeshes.length; ++i) {
            const mesh = skinnedMeshes[i];

            if (mesh instanceof SkinnedMeshComponent) {
              mesh.skeleton = skeleton;
            }
          }
        }

        for (let i = 0; i < children.length; i++) {
          const registerChildComponent = children[i];
          const child = await registerChildComponent(actor);
          child.attachToComponent(component);
        }

        if (parent) {
          component.attachToComponent(parent);
        }

        return component;
      });
    };
  }

  private async loadNodeShallow(index: number): Promise<GLTFParserRegisterComponentCallback> {
    const { camera, extensions, extras, isBone = false, matrix, mesh, name = '', rotation, scale, translation } = this.data.nodes[index];
    const pending: Promise<GLTFParserRegisterComponentCallback[]>[] = [mesh !== undefined ? this.getDependency('mesh', mesh) : Promise.resolve([])];

    if (camera !== undefined) {
      pending.push(this.getDependency('camera', camera));
    }

    return Promise.all(pending).then(([meshRegisterCallbacks, camera]) => async (actor) => {
      const cacheKey = 'node:' + index;
      let component: SceneComponent = this.cache.get(cacheKey);

      if (component) return component;

      const components: SceneComponent[] = [];

      for (let i = 0; i < meshRegisterCallbacks.length; i++) {
        const registerComponent = meshRegisterCallbacks[i];
        const component = await registerComponent(actor);

        if (!this.associations.has(component)) {
          this.associations.set(component, {});
        }

        this.associations.get(component).nodes = index;

        components.push(component);
      }

      if (isBone) {
        component = actor.addComponent(Bone);
      } else if (components.length === 1) {
        component = components[0];
      } else {
        component = actor.addComponent(SceneComponent);
      }

      if (component !== components[0]) {
        for (let i = 0; i < components.length; ++i) {
          components[i].attachToComponent(component);
        }
      }

      component.name = name;

      assignExtrasToUserData(component, extras);

      if (extensions) {
        addUnknownExtensionsToUserData(this.extensions, component, extensions);
      }

      if (matrix) {
        component.applyMatrix4(new Matrix4().fromArray(matrix));
      } else {
        if (translation) component.position.fromArray(translation);
        if (rotation) component.rotation.fromArray(rotation);
        if (scale) component.scale.fromArray(scale);
      }

      this.cache.set(cacheKey, component);

      return component;
    });
  }

  public async loadBuffer(index: number): Promise<ArrayBuffer> {
    const bufferDef = this.data.buffers[index];

    if (bufferDef.type && bufferDef.type !== 'arraybuffer') {
      throw new Error('THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.');
    }

    const uri = bufferDef.uri;

    // If present, GLB container is required to be the first buffer.
    if (uri === undefined && index === 0) {
      const extension = this.extensions[EXTENSIONS.KHR_BINARY_GLTF] as GLTFBinaryExtension;
      return Promise.resolve(extension.body as ArrayBuffer);
    }

    return new Promise((resolve, reject) => {
      this.fileLoader.load(
        LoaderUtils.resolveURL(uri!, this.options.path),
        data => resolve(data as ArrayBuffer),
        undefined,
        () => reject(new Error('THREE.GLTFLoader: Failed to load buffer "' + uri + '".'))
      );
    });
  }

  public async loadBufferView(index: number): Promise<ArrayBuffer> {
    const bufferViewDef = this.data.bufferViews[index];
    const buffer = await this.getDependency('buffer', bufferViewDef.buffer);
    const byteLength = bufferViewDef.byteLength ?? 0;
    const byteOffset = bufferViewDef.byteOffset ?? 0;

    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  public async loadAccessor(index: number): Promise<BufferAttribute | InterleavedBufferAttribute> {
    const accessorDef = this.data.accessors[index];

    if (accessorDef.bufferView === undefined && accessorDef.sparse === undefined) {
      const itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
      const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType];
      const array = new TypedArray(accessorDef.count * itemSize);

      return Promise.resolve(new BufferAttribute(array, itemSize, accessorDef.normalized === true));
    }

    const pendingBufferViews = [];

    if (accessorDef.bufferView !== undefined) {
      pendingBufferViews.push(this.getDependency('bufferView', accessorDef.bufferView));
    } else {
      pendingBufferViews.push(null);
    }

    if (accessorDef.sparse !== undefined) {
      pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.indices.bufferView));
      pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.values.bufferView));
    }

    return Promise.all(pendingBufferViews).then((bufferViews) => {
      const bufferView = bufferViews[0];
      const itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
      const TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType];

      // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
      const elementBytes = TypedArray.BYTES_PER_ELEMENT;
      const itemBytes = elementBytes * itemSize;
      const byteOffset = accessorDef.byteOffset ?? 0;
      const byteStride = accessorDef.bufferView !== undefined ? this.data.bufferViews[accessorDef.bufferView].byteStride : undefined;
      const normalized = accessorDef.normalized === true;
      let array, bufferAttribute: BufferAttribute | InterleavedBufferAttribute;

      // The buffer is not interleaved if the stride is the item size in bytes.
      if (byteStride && byteStride !== itemBytes) {
        // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
        // This makes sure that IBA.count reflects accessor.count properly
        const ibSlice = Math.floor(byteOffset / byteStride);
        const ibCacheKey = ['InterleavedBuffer', accessorDef.bufferView, accessorDef.componentType, ibSlice, accessorDef.count].join(':');
        let ib = this.cache.get(ibCacheKey);

        if (!ib) {
          array = new TypedArray(bufferView, ibSlice * byteStride, (accessorDef.count * byteStride) / elementBytes);

          // Integer parameters to IB/IBA are in array elements, not bytes.
          ib = new InterleavedBuffer(array, byteStride / elementBytes);

          this.cache.set(ibCacheKey, ib);
        }

        bufferAttribute = new InterleavedBufferAttribute(ib, itemSize, (byteOffset % byteStride) / elementBytes, normalized);
      } else {
        if (bufferView === null) {
          array = new TypedArray(accessorDef.count * itemSize);
        } else {
          array = new TypedArray(bufferView, byteOffset, accessorDef.count * itemSize);
        }

        bufferAttribute = new BufferAttribute(array, itemSize, normalized);
      }

      if (accessorDef.sparse !== undefined) {
        const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
        const TypedArrayIndices = WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];

        const byteOffsetIndices = accessorDef.sparse.indices.byteOffset ?? 0;
        const byteOffsetValues = accessorDef.sparse.values.byteOffset ?? 0;

        const sparseIndices = new TypedArrayIndices(bufferViews[1], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices);
        const sparseValues = new TypedArray(bufferViews[2], byteOffsetValues, accessorDef.sparse.count * itemSize);

        if (bufferView !== null) {
          // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
          bufferAttribute = new BufferAttribute(bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized);
        }

        for (let i = 0; i < sparseIndices.length; i++) {
          const index = sparseIndices[i];

          bufferAttribute.setX(index, sparseValues[i * itemSize]);

          if (itemSize >= 2) bufferAttribute.setY(index, sparseValues[i * itemSize + 1]);
          if (itemSize >= 3) bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]);
          if (itemSize >= 4) bufferAttribute.setW(index, sparseValues[i * itemSize + 3]);
          if (itemSize >= 5) throw new Error('THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.');
        }
      }

      return bufferAttribute;
    });
  }

  public async loadAnimation(index: number): Promise<GLTFParserRegisterComponentCallback> {
    const { channels, name = 'animation_' + index, parameters, samplers } = this.data.animations[index];

    const pending = {
      nodes: [] as Promise<GLTFParserRegisterComponentCallback>[],
      inputAccessors: [] as Promise<BufferAttribute>[],
      outputAccessors: [] as Promise<BufferAttribute>[],
      samplers: [] as any[],
      targets: [] as any[],
    };

    for (let i = 0; i < channels.length; ++i) {
      const channel = channels[i];
      const target = channel.target;

      if (target.node === undefined) continue;

      const sampler = samplers[channel.sampler];
      const input = parameters !== undefined ? parameters[sampler.input] : sampler.input;
      const output = parameters !== undefined ? parameters[sampler.output] : sampler.output;

      pending.nodes.push(this.getDependency('node', target.node));
      pending.inputAccessors.push(this.getDependency('accessor', input));
      pending.outputAccessors.push(this.getDependency('accessor', output));
      pending.samplers.push(sampler);
      pending.targets.push(target);
    }

    const result = await Promise.all([
      Promise.all(pending.nodes),
      Promise.all(pending.inputAccessors),
      Promise.all(pending.outputAccessors),
      Promise.all(pending.samplers),
      Promise.all(pending.targets),
    ]);

    return async (actor) => {
      const [nodes, inputAccessors, outputAccessors, samplers, targets] = result;
      const tracks = [];

      for (let i = 0; i < nodes.length; ++i) {
        const getComponent = nodes[i];

        if (!getComponent) continue;

        const component = await getComponent(actor);
        const inputAccessor = inputAccessors[i];
        const outputAccessor = outputAccessors[i];
        const sampler = samplers[i];
        const target = targets[i];

        // component.updateMatrix();

        const targetPath = PATH_PROPERTIES[target.path as keyof typeof PATH_PROPERTIES];

        let TypedKeyframeTrack: typeof NumberKeyframeTrack | QuaternionKeyframeTrack | VectorKeyframeTrack;

        switch (targetPath) {
          case PATH_PROPERTIES.weights:
            TypedKeyframeTrack = NumberKeyframeTrack;
            break;
          case PATH_PROPERTIES.rotation:
            TypedKeyframeTrack = QuaternionKeyframeTrack;
            break;
          case PATH_PROPERTIES.translation:
          case PATH_PROPERTIES.scale:
          default:
            TypedKeyframeTrack = VectorKeyframeTrack;
            break;
        }

        const componentName = component.name ?? 'node_' + index;
        const interpolation = sampler.interpolation !== undefined ? INTERPOLATION[sampler.interpolation as keyof typeof INTERPOLATION] : InterpolateLinear;
        const targetNames = [];

        if (targetPath === PATH_PROPERTIES.weights) {
          // component.traverse(function(object) {
          //   if (object.morphTargetInfluences) {
          //     targetNames.push(object.name ? object.name : object.uuid);
          //   }
          // });
        } else {
          targetNames.push(componentName);
        }

        let outputArray = outputAccessor.array;

        if (outputAccessor.normalized) {
          const scale = getNormalizedComponentScale(outputArray.constructor as any);
          const scaled = new Float32Array(outputArray.length);

          for (let j = 0; j < outputArray.length; j++) {
            scaled[j] = outputArray[j] * scale;
          }

          outputArray = scaled;
        }

        for (let j = 0; j < targetNames.length; j++) {
          const track = new TypedKeyframeTrack(targetNames[j] + '.' + targetPath, inputAccessor.array, outputArray, interpolation);

          if (sampler.interpolation === 'CUBICSPLINE') {
            // track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline(result) {
            //   const interpolantType = this instanceof QuaternionKeyframeTrack ? GLTFCubicSplineQuaternionInterpolant : GLTFCubicSplineInterpolant;
            //   return new interpolantType(this.times, this.values, this.getValueSize() / 3, result);
            // };
            // track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
          }

          tracks.push(track);
        }
      }

      return new AnimationClip(name, undefined, tracks) as any;
    };
  }

  public async assignTexture(
    params: MeshBasicMaterialParameters | MeshStandardMaterialParameters,
    mapName: string,
    mapDef: any,
    encoding?: number
  ): Promise<Texture | null> {
    const { extensions, index, texCoord } = mapDef;

    return this.getDependency('texture', index).then((texture: Texture) => {
      if (!texture) {
        return null;
      }

      if (texCoord !== undefined && texCoord > 0) {
        texture = texture.clone();
        texture.channel = texCoord;
      }

      const transformExt = this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM] as GLTFTextureTransformExtension;

      if (transformExt) {
        const ref = this.associations.get(texture);
        const data = extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM] ?? {};

        this.associations.set(transformExt.extendTexture(texture, data), ref);
      }

      if (encoding !== undefined) {
        if ('colorSpace' in texture) {
          texture.colorSpace = encoding === 3001 ? 'srgb' : 'srgb-linear';
        } else {
          (texture as Texture).encoding = encoding as THREE.TextureEncoding;
        }
      }

      params[mapName as keyof typeof params] = texture;

      return texture;
    });
  }

  private createTextureLoader(): GLTFParser['textureLoader'] {
    let isSafari = false;
    let isFirefox = false;
    let firefoxVersion = -1;

    if (typeof navigator !== 'undefined' && typeof navigator.userAgent !== 'undefined') {
      isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) === true;
      isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
      firefoxVersion = isFirefox ? Number(navigator.userAgent.match(/Firefox\/([0-9]+)\./)![1]) : -1;
    }

    if (typeof createImageBitmap === 'undefined' || isSafari || (isFirefox && firefoxVersion < 98)) {
      return new TextureLoader(this.options.manager);
    } else {
      return new ImageBitmapLoader(this.options.manager);
    }
  }
}

const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 1313821514, BIN: 5130562 };

interface GLTFBinaryExtensionHeader {
  magic: string;
  version: number;
  length: number;
}

class GLTFBinaryExtension implements GLTFLoaderExtension {
  private header: GLTFBinaryExtensionHeader;

  public body: ArrayBuffer | null = null;

  public content: string = '';

  public readonly name: string = EXTENSIONS.KHR_BINARY_GLTF;

  constructor(private readonly data: ArrayBuffer) {
    this.header = this.getHeader();

    if (this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
      throw new Error('THREE.GLTFLoader: Unsupported glTF-Binary header.');
    } else if (this.header.version < 2) {
      throw new Error('THREE.GLTFLoader: Legacy binary file detected.');
    }

    this.loadContent();

    if (this.content === '') {
      throw new Error('THREE.GLTFLoader: JSON content not found.');
    }
  }

  private getHeader(): GLTFBinaryExtensionHeader {
    const headerView = new DataView(this.data, 0, BINARY_EXTENSION_HEADER_LENGTH);

    return {
      magic: LoaderUtils.decodeText(new Uint8Array(this.data.slice(0, 4))),
      version: headerView.getUint32(4, true),
      length: headerView.getUint32(8, true),
    };
  }

  private loadContent(): any {
    const chunkContentsLength = this.header.length - BINARY_EXTENSION_HEADER_LENGTH;
    const chunkView = new DataView(this.data, BINARY_EXTENSION_HEADER_LENGTH);

    let chunkIndex = 0;

    while (chunkIndex < chunkContentsLength) {
      const chunkLength = chunkView.getUint32(chunkIndex, true);
      chunkIndex += 4;

      const chunkType = chunkView.getUint32(chunkIndex, true);
      chunkIndex += 4;

      if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
        const contentArray = new Uint8Array(this.data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
        this.content = LoaderUtils.decodeText(contentArray);
      } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
        const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
        this.body = this.data.slice(byteOffset, byteOffset + chunkLength);
      }

      chunkIndex += chunkLength;
    }
  }
}

class GLTFMaterialsUnlitExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_UNLIT;

  // @ts-ignore
  public getMaterialType(): typeof MeshBasicMaterial {
    return MeshBasicMaterial;
  }

  public async extendParams(params: MeshBasicMaterialParameters, { pbrMetallicRoughness }: GLTFMaterial, parser: GLTFParser): Promise<any> {
    params.color = new Color(1, 1, 1);
    params.opacity = 1;

    const pending: any[] = [];

    if (pbrMetallicRoughness) {
      const { baseColorFactor, baseColorTexture } = pbrMetallicRoughness;

      if (Array.isArray(baseColorFactor)) {
        params.color.fromArray(baseColorFactor);
        params.opacity = baseColorFactor[3];
      }

      if (baseColorTexture) {
        // pending.push(parser.assignTexture(params, 'map', baseColorTexture, 3001));
      }
    }

    return Promise.all(pending);
  }
}

class GLTFDracoMeshCompressionExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;

  constructor(private readonly json: GLTFFileContent, private readonly dracoLoader: DRACOLoader) {
    this.dracoLoader.preload();
  }

  public async decodePrimitive({ attributes, extensions = {} }: GLTFPrimitive, parser: GLTFParser): Promise<any> {
    const bufferViewIndex = extensions[this.name].bufferView;
    const extAttributes = extensions[this.name].attributes ?? {};
    const threeAttributeMap: Record<string, any> = {};
    const attributeNormalizedMap: Record<string, any> = {};
    const attributeTypeMap: Record<string, any> = {};

    for (const prop in extAttributes) {
      const attr = prop as keyof typeof ATTRIBUTES;
      const threeAttributeName = ATTRIBUTES[attr] ?? attr.toLowerCase();
      threeAttributeMap[threeAttributeName] = extAttributes[attr];
    }

    for (const prop in attributes) {
      const attr = prop as keyof typeof ATTRIBUTES;
      const threeAttributeName = ATTRIBUTES[attr] ?? attr.toLowerCase();

      if (extAttributes[attr]) {
        const accessorDef = this.json.accessors[attributes[attr]];
        const componentType = WEBGL_COMPONENT_TYPES[accessorDef.componentType];
        attributeTypeMap[threeAttributeName] = componentType.name;
        attributeNormalizedMap[threeAttributeName] = accessorDef.normalized === true;
      }
    }

    return parser.getDependency('bufferView', bufferViewIndex).then((bufferView: ArrayBuffer) => {
      return new Promise((resolve) => {
        // @ts-ignore
        this.dracoLoader.decodeDracoFile(
          bufferView,
          (inGeometry: BufferGeometry) => {
            // We need buffer from our own `BufferGeometry` class and copy the buffer from DRACOLoader which is a THREE.BufferGeometry
            const outGeometry = new BufferGeometry();
            outGeometry.copy(inGeometry);

            for (const name in outGeometry.attributes) {
              const attribute = outGeometry.attributes[name];
              const normalized = attributeNormalizedMap[name];
              if (normalized !== undefined) attribute.normalized = normalized;
            }

            resolve(outGeometry);
          },
          threeAttributeMap,
          attributeTypeMap
        );
      });
    });
  }
}

class GLTFTextureTransformExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

  public extendTexture(texture: Texture, transform: { [key: string]: any }): Texture {
    if (
      (transform.texCoord === undefined || transform.texCoord === texture.channel)
      && transform.offset === undefined
      && transform.rotation === undefined
      && transform.scale === undefined
    ) {
      return texture;
    }

    texture = texture.clone();

    if (transform.texCoord !== undefined) {
      texture.channel = transform.texCoord;
    }
    if (transform.offset !== undefined) {
      texture.offset.fromArray(transform.offset);
    }
    if (transform.rotation !== undefined) {
      texture.rotation = transform.rotation;
    }
    if (transform.scale !== undefined) {
      texture.repeat.fromArray(transform.scale);
    }

    texture.needsUpdate = true;

    return texture;
  }
}

class GLTFMeshQuantizationExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MESH_QUANTIZATION;
}

function getImageURIMimeType(uri: string): string {
  if (uri.search(/\.jpe?g($|\?)/i) > 0 || uri.search(/^data\:image\/jpeg/) === 0) return 'image/jpeg';
  if (uri.search(/\.webp($|\?)/i) > 0 || uri.search(/^data\:image\/webp/) === 0) return 'image/webp';
  return 'image/png';
}

function assignExtrasToUserData(object: InstanceType<TClass>, extras?: Record<string, unknown>): void {
  if (extras) {
    if (typeof extras.apex === 'string') {
      extras.apex = JSON.parse(extras.apex);
    }
    if (typeof extras === 'object') {
      Object.assign(object.userData, extras);
    } else {
      console.warn('THREE.GLTFLoader: Ignoring primitive type .extras, ' + extras);
    }
  }
}

function createPrimitiveKey({ attributes, extensions = {}, indices, mode, targets = [] }: GLTFPrimitive): string {
  const keys: Array<string | number> = [];
  const dracoExt = extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION];

  if (dracoExt) {
    keys.push('draco', dracoExt.bufferView, dracoExt.indices, createAttributesKey(dracoExt.attributes));
  } else {
    keys.push(indices, createAttributesKey(attributes), mode);
  }

  for (let i = 0; i < targets.length; i++) {
    keys.push(createAttributesKey(targets[i]));
  }

  return keys.join(':');
}

function createAttributesKey(attributes: Record<string, number>): string {
  const keys: Array<string | number> = [];
  const sortedAttrs = Object.keys(attributes).sort();

  for (let i = 0; i < sortedAttrs.length; i++) {
    keys.push(sortedAttrs[i], attributes[sortedAttrs[i]]);
  }

  return keys.join(':') + ';';
}

function createDefaultMaterial(cache: Record<string, any>): MeshStandardMaterial {
  if (!cache['DefaultMaterial']) {
    cache['DefaultMaterial'] = new MeshStandardMaterial({
      color: new Color(0xffffff),
      emissive: 0,
      metalness: 1,
      roughness: 1,
      transparent: false,
      depthTest: true,
      side: FrontSide,
    });
  }
  return cache['DefaultMaterial'];
}

async function addPrimitiveAttributes(geometry: BufferGeometry, primitiveDef: GLTFPrimitive, parser: GLTFParser): Promise<any> {
  const pending = [];

  async function assignAttributeAccessor(accessorIndex: number, attrName: string): Promise<void> {
    return parser.getDependency('accessor', accessorIndex).then((accessor: BufferAttribute | InterleavedBufferAttribute) => {
      geometry.setAttribute(attrName, accessor);
    });
  }

  const { attributes, extras, indices, targets = [] } = primitiveDef;

  for (const prop in attributes) {
    const attr = prop as keyof typeof ATTRIBUTES;
    const threeAttributeName = ATTRIBUTES[attr] ?? attr.toLowerCase();

    if (threeAttributeName in geometry.attributes) {
      continue;
    }

    pending.push(assignAttributeAccessor(attributes[attr], threeAttributeName));
  }

  if (indices !== undefined && !geometry.index) {
    pending.push(
      parser.getDependency('accessor', indices).then((accessor: BufferAttribute) => {
        geometry.setIndex(accessor);
      })
    );
  }

  assignExtrasToUserData(geometry, extras);
  computeBounds(geometry, primitiveDef, parser);

  return Promise.all(pending).then(() => addMorphTargets(geometry, targets, parser));
}

function computeBounds(geometry: BufferGeometry, { attributes, targets }: GLTFPrimitive, parser: GLTFParser): void {
  if (attributes.POSITION === undefined) {
    return;
  }

  const box = new Box3();
  const sphere = new Sphere();
  const accessor = parser.data.accessors[attributes.POSITION];
  const min = accessor.min;
  const max = accessor.max;

  if (min !== undefined && max !== undefined) {
    box.set(new Vector3(min[0], min[1], min[2]), new Vector3(max[0], max[1], max[2]));

    if (accessor.normalized) {
      const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
      box.min.multiplyScalar(boxScale);
      box.max.multiplyScalar(boxScale);
    }
  } else {
    console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');
    return;
  }

  if (targets) {
    const maxDisplacement = new Vector3();
    const vector = new Vector3();

    for (let i = 0, il = targets.length; i < il; i++) {
      const target = targets[i];

      if (target.POSITION !== undefined) {
        const accessor = parser.data.accessors[target.POSITION];
        const min = accessor.min;
        const max = accessor.max;

        if (min !== undefined && max !== undefined) {
          vector.setX(Math.max(Math.abs(min[0]), Math.abs(max[0])));
          vector.setY(Math.max(Math.abs(min[1]), Math.abs(max[1])));
          vector.setZ(Math.max(Math.abs(min[2]), Math.abs(max[2])));

          if (accessor.normalized) {
            const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
            vector.multiplyScalar(boxScale);
          }

          maxDisplacement.max(vector);
        } else {
          console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');
        }
      }
    }

    box.expandByVector(maxDisplacement);
  }

  box.getCenter(sphere.center);
  sphere.radius = box.min.distanceTo(box.max) / 2;

  geometry.boundingBox = box;
  geometry.boundingSphere = sphere;
}

function getNormalizedComponentScale(constructor: TypedArrayConstructor): number {
  switch (constructor) {
    case Int8Array:
      return 1 / 127;
    case Uint8Array:
      return 1 / 255;
    case Int16Array:
      return 1 / 32767;
    case Uint16Array:
      return 1 / 65535;
    default:
      throw new Error('THREE.GLTFLoader: Unsupported normalized accessor component type.');
  }
}

async function addMorphTargets(geometry: BufferGeometry, targets: GLTFPrimitive['targets'] = [], parser: GLTFParser): Promise<BufferGeometry> {
  let hasMorphPosition = false;
  let hasMorphNormal = false;
  let hasMorphColor = false;

  for (let i = 0, il = targets.length; i < il; i++) {
    const target = targets[i];

    if (typeof target.POSITION !== 'undefined') hasMorphPosition = true;
    if (typeof target.NORMAL !== 'undefined') hasMorphNormal = true;
    if (typeof target.COLOR_0 !== 'undefined') hasMorphColor = true;

    if (hasMorphPosition && hasMorphNormal && hasMorphColor) {
      break;
    }
  }

  if (!hasMorphPosition && !hasMorphNormal && !hasMorphColor) {
    return Promise.resolve(geometry);
  }

  const pendingPositionAccessors = [];
  const pendingNormalAccessors = [];
  const pendingColorAccessors = [];

  for (let i = 0, il = targets.length; i < il; i++) {
    const target = targets[i];

    if (hasMorphPosition) {
      const pendingAccessor = typeof target.POSITION !== 'undefined' ? parser.getDependency('accessor', target.POSITION) : geometry.attributes.position;
      pendingPositionAccessors.push(pendingAccessor);
    }

    if (hasMorphNormal) {
      const pendingAccessor = typeof target.NORMAL !== 'undefined' ? parser.getDependency('accessor', target.NORMAL) : geometry.attributes.normal;
      pendingNormalAccessors.push(pendingAccessor);
    }
    if (hasMorphColor) {
      const pendingAccessor = typeof target.COLOR_0 !== 'undefined' ? parser.getDependency('accessor', target.COLOR_0) : geometry.attributes.color;
      pendingColorAccessors.push(pendingAccessor);
    }
  }

  return Promise.all([Promise.all(pendingPositionAccessors), Promise.all(pendingNormalAccessors), Promise.all(pendingColorAccessors)]).then(
    ([positions, normals, colors]) => {
      if (hasMorphPosition) geometry.morphAttributes.position = positions;
      if (hasMorphNormal) geometry.morphAttributes.normal = normals;
      if (hasMorphColor) geometry.morphAttributes.color = colors;

      geometry.morphTargetsRelative = true;

      return geometry;
    }
  );
}

function updateMorphTargets(component: MeshComponent, { extras, weights = [] }: GLTFMesh): void {
  // mesh.updateMorphTargets();

  for (let i = 0; i < weights.length; i++) {
    // mesh.morphTargetInfluences[i] = weights[i];
  }

  if (extras && Array.isArray(extras.targetNames)) {
    const { targetNames } = extras;

    // if (mesh.morphTargetInfluences.length === targetNames.length) {
    //   mesh.morphTargetDictionary = {};

    //   for (let i = 0; i < targetNames.length; i++) {
    //     mesh.morphTargetDictionary[targetNames[i]] = i;
    //   }
    // } else {
    //   console.warn('THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.');
    // }
  }
}

function addUnknownExtensionsToUserData(knownExtensions: Record<string, any>, object: InstanceType<TClass>, extensions: GLTFObject['extensions']): void {
  for (const name in extensions) {
    if (knownExtensions[name]) {
      object.userData.gltfExtensions = {
        ...object.userData.gltfExtensions,
        [name]: extensions[name],
      };
    }
  }
}

class GLTFMaterialsClearcoatExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;

  constructor(private readonly parser: GLTFParser) {}

  public getMaterialType(materialIndex: number): any {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions?.[this.name]) {
      return null;
    }

    return MeshPhysicalMaterial;
  }

  public async extendMaterialParams(materialIndex: number, materialParams: Record<string, any>): Promise<any> {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions?.[this.name]) {
      return null;
    }

    const pending = [];
    const extension = materialDef.extensions[this.name];

    if (extension.clearcoatFactor !== undefined) {
      materialParams.clearcoat = extension.clearcoatFactor;
    }

    if (extension.clearcoatTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'clearcoatMap', extension.clearcoatTexture));
    }

    if (extension.clearcoatRoughnessFactor !== undefined) {
      materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;
    }

    if (extension.clearcoatRoughnessTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture));
    }

    if (extension.clearcoatNormalTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'clearcoatNormalMap', extension.clearcoatNormalTexture));

      if (extension.clearcoatNormalTexture.scale !== undefined) {
        const scale = extension.clearcoatNormalTexture.scale;
        materialParams.clearcoatNormalScale = new Vector2(scale, scale);
      }
    }

    return Promise.all(pending);
  }
}

class GLTFTextureBasisUExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_TEXTURE_BASISU;

  constructor(private readonly parser: GLTFParser) {}

  public async loadTexture(textureIndex: number): Promise<Texture | null> {
    const data = this.parser.data;
    const textureDef = data.textures[textureIndex];

    if (!textureDef.extensions?.[this.name]) {
      return null;
    }

    const extension = textureDef.extensions[this.name];
    const loader = this.parser.options.ktx2Loader;

    if (!loader) {
      if (data.extensionsRequired && data.extensionsRequired.indexOf(this.name) >= 0) {
        throw new Error('THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures');
      } else {
        return null;
      }
    }

    return this.parser.loadTextureImage(textureIndex, extension.source, loader);
  }
}

/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
class GLTFTextureWebPExtension implements GLTFLoaderExtension {
  public isSupported: Promise<boolean> | null = null;

  public readonly name: string = EXTENSIONS.EXT_TEXTURE_WEBP;

  constructor(private readonly parser: GLTFParser) {}

  public async loadTexture(textureIndex: number): Promise<any> {
    const name = this.name;
    const textureDef = this.parser.data.textures[textureIndex];

    if (!textureDef.extensions || !textureDef.extensions[name]) {
      return null;
    }

    const extension = textureDef.extensions[name];
    const source = this.parser.data.images[extension.source];

    let loader: any = this.parser.textureLoader;

    if (source.uri) {
      const handler = this.parser.options.manager.getHandler(source.uri);
      if (handler !== null) loader = handler;
    }

    return this.detectSupport().then((isSupported: boolean) => {
      if (isSupported) return this.parser.loadTextureImage(textureIndex, extension.source, loader);

      const extensionsRequired = this.parser.data.extensionsRequired ?? [];

      if (this.parser.data.extensionsRequired && extensionsRequired.indexOf(name) >= 0) {
        throw new Error('THREE.GLTFLoader: WebP required by asset but unsupported.');
      }

      // Fall back to PNG or JPEG.
      return this.parser.loadTexture(textureIndex);
    });
  }

  public detectSupport(): Promise<boolean> {
    if (!this.isSupported) {
      this.isSupported = new Promise<boolean>((resolve) => {
        const image = new Image();

        // Lossy test image. Support for lossy images doesn't guarantee support for all
        // WebP images, unfortunately.
        image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

        image.onload = image.onerror = (): void => {
          resolve(image.height === 1);
        };
      });
    }

    return this.isSupported;
  }
}

/**
 * AVIF Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_avif
 */
class GLTFTextureAVIFExtension implements GLTFLoaderExtension {
  public isSupported: Promise<boolean> | null = null;

  public readonly name: string = EXTENSIONS.EXT_TEXTURE_AVIF;

  constructor(private readonly parser: GLTFParser) {}

  public async loadTexture(textureIndex: number): Promise<any> {
    const name = this.name;
    const textureDef = this.parser.data.textures[textureIndex];

    if (!textureDef.extensions || !textureDef.extensions[name]) {
      return null;
    }

    const extension = textureDef.extensions[name];
    const source = this.parser.data.images[extension.source];

    let loader: any = this.parser.textureLoader;

    if (source.uri) {
      const handler = this.parser.options.manager.getHandler(source.uri);
      if (handler !== null) loader = handler;
    }

    return this.detectSupport().then((isSupported: boolean) => {
      if (isSupported) return this.parser.loadTextureImage(textureIndex, extension.source, loader);

      const extensionsRequired = this.parser.data.extensionsRequired ?? [];

      if (this.parser.data.extensionsRequired && extensionsRequired.indexOf(name) >= 0) {
        throw new Error('THREE.GLTFLoader: AVIF required by asset but unsupported.');
      }

      // Fall back to PNG or JPEG.
      return this.parser.loadTexture(textureIndex);
    });
  }

  public detectSupport(): Promise<boolean> {
    if (!this.isSupported) {
      this.isSupported = new Promise<boolean>((resolve) => {
        const image = new Image();

        // Lossy test image. Support for lossy images doesn't guarantee support for all
        // WebP images, unfortunately.
        image.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';

        image.onload = image.onerror = (): void => {
          resolve(image.height === 1);
        };
      });
    }

    return this.isSupported;
  }
}

/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
class GLTFMeshoptCompression implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.EXT_MESHOPT_COMPRESSION;

  constructor(private readonly parser: GLTFParser) {}

  public async loadBufferView(index: number): Promise<any> {
    const data = this.parser.data;
    const bufferView = data.bufferViews[index];
    const extensionsRequired = data.extensionsRequired ?? [];

    if (bufferView.extensions && bufferView.extensions[this.name]) {
      const extensionDef = bufferView.extensions[this.name];

      const buffer = this.parser.getDependency('buffer', extensionDef.buffer);
      const decoder = this.parser.options.meshoptDecoder;

      if (!decoder || !decoder.supported) {
        if (data.extensionsRequired && extensionsRequired.indexOf(this.name) >= 0) {
          throw new Error('THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files');
        } else {
          // Assumes that the extension is optional and that fallback buffer data is present
          return null;
        }
      }

      return buffer.then(async (res) => {
        const byteOffset = extensionDef.byteOffset || 0;
        const byteLength = extensionDef.byteLength || 0;

        const count = extensionDef.count;
        const stride = extensionDef.byteStride;

        const source = new Uint8Array(res, byteOffset, byteLength);

        if (decoder.decodeGltfBufferAsync) {
          return decoder
            .decodeGltfBufferAsync(count, stride, source, extensionDef.mode, extensionDef.filter)
            .then((res: any) => res.buffer);
        } else {
          // Support for MeshoptDecoder 0.18 or earlier, without decodeGltfBufferAsync
          return decoder.ready.then(() => {
            const result = new ArrayBuffer(count * stride);
            decoder.decodeGltfBuffer(
              new Uint8Array(result),
              count,
              stride,
              source,
              extensionDef.mode,
              extensionDef.filter,
            );
            return result;
          });
        }
      });
    } else {
      return null;
    }
  }
}

/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
class GLTFMaterialsSheenExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_SHEEN;

  constructor(private readonly parser: GLTFParser) {}

  public getMaterialType(index: number): any {
    const materialDef = this.parser.data.materials[index];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;

    return MeshPhysicalMaterial;
  }

  public async extendMaterialParams(materialIndex: number, materialParams: Record<string, any>): Promise<any> {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];

    materialParams.sheenColor = new Color(0, 0, 0);
    materialParams.sheenRoughness = 0;
    materialParams.sheen = 1;

    const extension = materialDef.extensions[this.name];

    if (extension.sheenColorFactor !== undefined) {
      materialParams.sheenColor.fromArray(extension.sheenColorFactor);
    }

    if (extension.sheenRoughnessFactor !== undefined) {
      materialParams.sheenRoughness = extension.sheenRoughnessFactor;
    }

    if (extension.sheenColorTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'sheenColorMap', extension.sheenColorTexture, 3001)); // sRGBEncoding
    }

    if (extension.sheenRoughnessTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'sheenRoughnessMap', extension.sheenRoughnessTexture));
    }

    return Promise.all(pending);
  }
}

/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */
class GLTFMaterialsTransmissionExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;

  constructor(private readonly parser: GLTFParser) {}

  public getMaterialType(index: number): any {
    const materialDef = this.parser.data.materials[index];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;

    return MeshPhysicalMaterial;
  }

  public async extendMaterialParams(materialIndex: number, materialParams: Record<string, any>): Promise<any> {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];
    const extension = materialDef.extensions[this.name];

    if (extension.transmissionFactor !== undefined) {
      materialParams.transmission = extension.transmissionFactor;
    }

    if (extension.transmissionTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'transmissionMap', extension.transmissionTexture));
    }

    return Promise.all(pending);
  }
}

/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
class GLTFMaterialsVolumeExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_VOLUME;

  constructor(private readonly parser: GLTFParser) {}

  public getMaterialType(index: number): any {
    const materialDef = this.parser.data.materials[index];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;

    return MeshPhysicalMaterial;
  }

  public async extendMaterialParams(materialIndex: number, materialParams: Record<string, any>): Promise<any> {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];
    const extension = materialDef.extensions[this.name];

    materialParams.thickness = extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;

    if (extension.thicknessTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'thicknessMap', extension.thicknessTexture));
    }

    materialParams.attenuationDistance = extension.attenuationDistance || Infinity;

    const colorArray = extension.attenuationColor || [1, 1, 1];
    materialParams.attenuationColor = new Color(colorArray[0], colorArray[1], colorArray[2]);

    return Promise.all(pending);
  }
}

/**
 * Materials ior Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_ior
 */
class GLTFMaterialsIorExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_IOR;

  constructor(private readonly parser: GLTFParser) {}

  public getMaterialType(index: number): any {
    const materialDef = this.parser.data.materials[index];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;

    return MeshPhysicalMaterial;
  }

  public async extendMaterialParams(materialIndex: number, materialParams: Record<string, any>): Promise<any> {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const extension = materialDef.extensions[this.name];

    materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;

    return Promise.resolve();
  }
}

/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
class GLTFMaterialsSpecularExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_SPECULAR;

  constructor(private readonly parser: GLTFParser) {}

  public getMaterialType(index: number): any {
    const materialDef = this.parser.data.materials[index];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;

    return MeshPhysicalMaterial;
  }

  public async extendMaterialParams(materialIndex: number, materialParams: Record<string, any>): Promise<any> {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];
    const extension = materialDef.extensions[this.name];

    materialParams.specularIntensity = extension.specularFactor !== undefined ? extension.specularFactor : 1.0;

    if (extension.specularTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'specularIntensityMap', extension.specularTexture));
    }

    const colorArray = extension.specularColorFactor || [1, 1, 1];
    materialParams.specularColor = new Color(colorArray[0], colorArray[1], colorArray[2]);

    if (extension.specularColorTexture !== undefined) {
      pending.push(
        this.parser.assignTexture(materialParams, 'specularColorMap', extension.specularColorTexture, 3001), // sRGBEncoding
      );
    }

    return Promise.all(pending);
  }
}

/**
 * Materials anisotropy Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_anisotropy
 */
class GLTFMaterialsAnisotropyExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_ANISOTROPY;

  constructor(private readonly parser: GLTFParser) {}

  public getMaterialType(index: number): any {
    const materialDef = this.parser.data.materials[index];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;

    return MeshPhysicalMaterial;
  }

  public async extendMaterialParams(materialIndex: number, materialParams: Record<string, any>): Promise<any> {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];
    const extension = materialDef.extensions[this.name];

    if (extension.anisotropyStrength !== undefined) {
      materialParams.anisotropy = extension.anisotropyStrength;
    }

    if (extension.anisotropyRotation !== undefined) {
      materialParams.anisotropyRotation = extension.anisotropyRotation;
    }

    if (extension.anisotropyTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'anisotropyMap', extension.anisotropyTexture));
    }

    return Promise.all(pending);
  }
}

/**
 * Materials Emissive Strength Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/blob/5768b3ce0ef32bc39cdf1bef10b948586635ead3/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md
 */
class GLTFMaterialsEmissiveStrengthExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_EMISSIVE_STRENGTH;

  constructor(private readonly parser: GLTFParser) {}

  public async extendMaterialParams(materialIndex: number, materialParams: Record<string, any>): Promise<any> {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const emissiveStrength = materialDef.extensions[this.name].emissiveStrength;

    if (emissiveStrength !== undefined) {
      materialParams.emissiveIntensity = emissiveStrength;
    }

    return Promise.resolve();
  }
}

/**
 * Iridescence Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_iridescence
 */
class GLTFMaterialsIridescenceExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_IRIDESCENCE;

  constructor(private readonly parser: GLTFParser) {}

  public getMaterialType(index: number): any {
    const materialDef = this.parser.data.materials[index];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;

    return MeshPhysicalMaterial;
  }

  public async extendMaterialParams(materialIndex: number, materialParams: Record<string, any>): Promise<any> {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    const pending = [];
    const extension = materialDef.extensions[this.name];

    if (extension.iridescenceFactor !== undefined) {
      materialParams.iridescence = extension.iridescenceFactor;
    }

    if (extension.iridescenceTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'iridescenceMap', extension.iridescenceTexture));
    }

    if (extension.iridescenceIor !== undefined) {
      materialParams.iridescenceIOR = extension.iridescenceIor;
    }

    if (materialParams.iridescenceThicknessRange === undefined) {
      materialParams.iridescenceThicknessRange = [100, 400];
    }

    if (extension.iridescenceThicknessMinimum !== undefined) {
      materialParams.iridescenceThicknessRange[0] = extension.iridescenceThicknessMinimum;
    }

    if (extension.iridescenceThicknessMaximum !== undefined) {
      materialParams.iridescenceThicknessRange[1] = extension.iridescenceThicknessMaximum;
    }

    if (extension.iridescenceThicknessTexture !== undefined) {
      pending.push(
        this.parser.assignTexture(materialParams, 'iridescenceThicknessMap', extension.iridescenceThicknessTexture),
      );
    }

    return Promise.all(pending);
  }
}

/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
// class GLTFLightsExtension implements GLTFLoaderExtension {
//   private readonly cache: { refs: Record<string, any>, uses: Record<string, any> } = { refs: {}, uses: {} }

//   public readonly name: string = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

//   constructor(private readonly parser: GLTFParser) {}

//   public _markDefs(): void {
//     const parser = this.parser
//     const nodeDefs = this.parser.json.nodes || []

//     for (let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex++) {
//       const nodeDef = nodeDefs[nodeIndex]

//       if (nodeDef.extensions && nodeDef.extensions[this.name] && nodeDef.extensions[this.name].light !== undefined) {
//         parser._addNodeRef(this.cache, nodeDef.extensions[this.name].light)
//       }
//     }
//   }

//   public _loadLight(lightIndex: number) {
//     const cacheKey = 'light:' + lightIndex
//     let dependency = this.parser.cache.get(cacheKey)

//     if (dependency) return dependency

//     const data = this.parser.data
//     const extensions = (data.extensions && data.extensions[this.name]) || {}
//     const lightDefs = extensions.lights || []
//     const lightDef = lightDefs[lightIndex]
//     let lightNode

//     const color = new Color(0xffffff)

//     if (lightDef.color !== undefined) color.fromArray(lightDef.color)

//     const range = lightDef.range !== undefined ? lightDef.range : 0

//     switch (lightDef.type) {
//       case 'directional':
//         lightNode = new DirectionalLight(color)
//         lightNode.target.position.set(0, 0, -1)
//         lightNode.add(lightNode.target)
//         break

//       case 'point':
//         lightNode = new PointLight(color)
//         lightNode.distance = range
//         break

//       case 'spot':
//         lightNode = new SpotLight(color)
//         lightNode.distance = range
//         // Handle spotlight properties.
//         lightDef.spot = lightDef.spot || {}
//         lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0
//         lightDef.spot.outerConeAngle =
//           lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0
//         lightNode.angle = lightDef.spot.outerConeAngle
//         lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle
//         lightNode.target.position.set(0, 0, -1)
//         lightNode.add(lightNode.target)
//         break

//       default:
//         throw new Error('THREE.GLTFLoader: Unexpected light type: ' + lightDef.type)
//     }

//     // Some lights (e.g. spot) default to a position other than the origin. Reset the position
//     // here, because node-level parsing will only override position if explicitly specified.
//     lightNode.position.set(0, 0, 0)

//     lightNode.decay = 2

//     assignExtrasToUserData(lightNode, lightDef)

//     if (lightDef.intensity !== undefined) lightNode.intensity = lightDef.intensity

//     lightNode.name = parser.createUniqueName(lightDef.name || 'light_' + lightIndex)

//     dependency = Promise.resolve(lightNode)

//     parser.cache.add(cacheKey, dependency)

//     return dependency
//   }

//   getDependency(type, index) {
//     if (type !== 'light') return

//     return this._loadLight(index)
//   }

//   createNodeAttachment(nodeIndex) {
//     const self = this
//     const parser = this.parser
//     const json = parser.json
//     const nodeDef = json.nodes[nodeIndex]
//     const lightDef = (nodeDef.extensions && nodeDef.extensions[this.name]) || {}
//     const lightIndex = lightDef.light

//     if (lightIndex === undefined) return null

//     return this._loadLight(lightIndex).then(function (light) {
//       return parser._getNodeRef(self.cache, lightIndex, light)
//     })
//   }
// }

/**
 * GPU Instancing Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 *
 */
// class GLTFMeshGpuInstancing {
//   public readonly name: string = EXTENSIONS.KHR_MATERIALS_VOLUME;

//   constructor(private readonly parser: GLTFParser) {}

//   public async createNodeMesh(index: number): Promise<any> {
//     const nodeDef = this.parser.data.nodes[index];

//     if (!nodeDef.extensions || !nodeDef.extensions[this.name] || nodeDef.mesh === undefined) {
//       return null;
//     }

//     const meshDef = this.parser.data.meshes[nodeDef.mesh];

//     // No Points or Lines + Instancing support yet

//     for (const primitive of meshDef.primitives) {
//       if (
//         primitive.mode !== WEBGL_CONSTANTS.TRIANGLES
//         && primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_STRIP
//         && primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_FAN
//         && primitive.mode !== undefined
//       ) {
//         return null;
//       }
//     }

//     const extensionDef = nodeDef.extensions[this.name];
//     const attributesDef = extensionDef.attributes;

//     // @TODO: Can we support InstancedMesh + SkinnedMesh?

//     const pending = [];
//     const attributes: Record<string, any> = {};

//     for (const key in attributesDef) {
//       pending.push(
//         this.parser.getDependency('accessor', attributesDef[key]).then((accessor) => {
//           attributes[key] = accessor;
//           return attributes[key];
//         }),
//       );
//     }

//     if (pending.length < 1) {
//       return null;
//     }

//     pending.push(this.parser.createNodeMesh(index));

//     return Promise.all(pending).then((results) => {
//       const nodeObject = results.pop();
//       const meshes = nodeObject.isGroup ? nodeObject.children : [nodeObject];
//       const count = results[0].count; // All attribute counts should be same
//       const instancedMeshes = [];

//       for (const mesh of meshes) {
//         // Temporal variables
//         const m = new Matrix4();
//         const p = new Vector3();
//         const q = new Quaternion();
//         const s = new Vector3(1, 1, 1);

//         const instancedMesh = new InstancedMesh(mesh.geometry, mesh.material, count);

//         for (let i = 0; i < count; i++) {
//           if (attributes.TRANSLATION) {
//             p.fromBufferAttribute(attributes.TRANSLATION, i);
//           }

//           if (attributes.ROTATION) {
//             q.fromBufferAttribute(attributes.ROTATION, i);
//           }

//           if (attributes.SCALE) {
//             s.fromBufferAttribute(attributes.SCALE, i);
//           }

//           instancedMesh.setMatrixAt(i, m.compose(p, q, s));
//         }

//         // Add instance attributes to the geometry, excluding TRS.
//         for (const attributeName in attributes) {
//           if (attributeName !== 'TRANSLATION' && attributeName !== 'ROTATION' && attributeName !== 'SCALE') {
//             mesh.geometry.setAttribute(attributeName, attributes[attributeName]);
//           }
//         }

//         // Just in case
//         Object3D.prototype.copy.call(instancedMesh, mesh);

//         this.parser.assignFinalMaterial(instancedMesh);

//         instancedMeshes.push(instancedMesh);
//       }

//       if (nodeObject.isGroup) {
//         nodeObject.clear();

//         nodeObject.add(...instancedMeshes);

//         return nodeObject;
//       }

//       return instancedMeshes[0];
//     });
//   }
// }
