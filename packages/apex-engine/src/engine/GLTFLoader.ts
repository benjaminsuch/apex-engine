import { Box3, BufferAttribute, ClampToEdgeWrapping, DefaultLoadingManager, DoubleSide, FileLoader, FrontSide, ImageBitmapLoader, InterleavedBuffer, InterleavedBufferAttribute, InterpolateDiscrete, InterpolateLinear, LinearFilter, LinearMipmapLinearFilter, LinearMipmapNearestFilter, Loader, LoaderUtils, type LoadingManager, MirroredRepeatWrapping, NearestFilter, NearestMipmapLinearFilter, NearestMipmapNearestFilter, RepeatWrapping, Sphere, TextureLoader, Vector2, Vector3 } from 'three';
import { DRACOLoader, type GLTF, type KTX2Loader } from 'three-stdlib';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { Actor } from './Actor';
import { type Level } from './Level';
import { BufferGeometry } from './renderer/BufferGeometry';
import { Color } from './renderer/Color';
import { type Material } from './renderer/materials/Material';
import { MeshBasicMaterial, type MeshBasicMaterialParameters } from './renderer/materials/MeshBasicMaterial';
import { MeshStandardMaterial, type MeshStandardMaterialParameters } from './renderer/materials/MeshStandardMaterial';
import { MeshComponent } from './renderer/MeshComponent';
import { SceneComponent } from './renderer/SceneComponent';
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

  constructor(
    private readonly level: Level,
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    super();

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.dracoLoader.setDecoderConfig({ type: 'js' });

    this.registerExtensions();
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

    const loader = new FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType('arraybuffer');
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
    console.log('GLTFLoader.parse', json);
    const parser = this.instantiationService.createInstance(GLTFParser, json, {
      // extensions: this.extensions,
      path,
      crossOrigin: this.crossOrigin,
      requestHeader: this.requestHeader,
      manager: this.manager,
      ktx2Loader: this.ktx2Loader,
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

  public async parseAsync(data: string | ArrayBuffer, path: string): Promise<GLTFParserRegisterActorCallback[]> {
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
      // parser => new GLTFTextureWebPExtension(parser),
      // parser => new GLTFTextureAVIFExtension(parser),
      // parser => new GLTFMaterialsSheenExtension(parser),
      // parser => new GLTFMaterialsTransmissionExtension(parser),
      // parser => new GLTFMaterialsVolumeExtension(parser),
      // parser => new GLTFMaterialsIorExtension(parser),
      // parser => new GLTFMaterialsEmissiveStrengthExtension(parser),
      // parser => new GLTFMaterialsSpecularExtension(parser),
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
}

export interface GLTFNode extends GLTFObject {
  camera?: number;
  children?: number[];
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
  animations?: GLTFAnimation[];
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
  crossOrigin: string;
  requestHeader: { [header: string]: string };
}

export type GLTFParserRegisterActorCallback = (level: Level) => Promise<Actor>;

export type GLTFParserOnLoadHandler = (actors: GLTFParserRegisterActorCallback[]) => void;

export type GLTFParserOnErrorHandler = (event: ErrorEvent) => void;

export type GLTFParserRegisterComponentCallback = (actor: Actor, parent?: SceneComponent) => Promise<SceneComponent>;

export class GLTFParser {
  private readonly textureCache: Record<string, Promise<Texture | null>> = {};

  private readonly sourceCache: Record<number, Promise<Texture>> = {};

  private readonly textureLoader: TextureLoader | ImageBitmapLoader;

  private readonly fileLoader: FileLoader;

  private readonly associations: Map<any, any> = new Map();

  private readonly cache: Map<string, any> = new Map();

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

    this.fileLoader = new FileLoader(this.options.manager);
    this.fileLoader.setResponseType('arraybuffer');
    this.fileLoader.setRequestHeader(this.options.requestHeader);

    if (this.options.crossOrigin === 'use-credentials') {
      this.fileLoader.setWithCredentials(true);
    }
  }

  public parse(onLoad: GLTFParserOnLoadHandler, onError?: GLTFParserOnErrorHandler): void {
    this.loadScene(0).then(onLoad).catch(onError);
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

    if (!dependency) {
      switch (type) {
        case 'accessor':
          dependency = this.loadAccessor(index);
          break;
        case 'buffer':
          dependency = this.loadBuffer(index);
          break;
        case 'bufferView':
          dependency = this.loadBufferView(index);
          break;
        case 'bufferView':
          dependency = this.loadCamera(index);
          break;
        case 'material':
          dependency = this.invokeOne((ext: GLTFLoaderExtension) => ext.loadMaterial?.(index));
          break;
        case 'mesh':
          dependency = this.invokeOne((ext: GLTFLoaderExtension) => ext.loadMesh?.(index));
          break;
        case 'node':
          dependency = this.loadNode(index);
          break;
        case 'scene':
          dependency = this.loadScene(index);
          break;
        case 'skin':
          dependency = this.loadSkin(index);
          break;
        case 'texture':
          dependency = this.invokeOne((ext: GLTFLoaderExtension) => ext.loadTexture?.(index));
          break;
      }

      this.cache.set(cacheKey, dependency);
    }

    return dependency;
  }

  public async loadScene(index: number): Promise<GLTFParserRegisterActorCallback[]> {
    const { nodes = [] } = this.data.scenes[index];
    const callbacks: GLTFParserRegisterActorCallback[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const registerComponent = await this.getDependency('node', nodes[i]);

      callbacks.push(async (level) => {
        const actor = level.getWorld().spawnActor(Actor);
        await registerComponent(actor);
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
            onLoad = (imageBitmap: ImageBitmap): void => {
              const texture = new Texture(imageBitmap);
              texture.needsUpdate = true;
              resolve(texture);
            };
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
    const pending = [];

    const { extensions = {}, pbrMetallicRoughness = {} } = materialDef;

    const materialParams: Record<string, any> = {};
    let materialType: typeof MeshBasicMaterial | typeof MeshStandardMaterial;

    if (extensions[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
      const kmuExtension = this.extensions[EXTENSIONS.KHR_MATERIALS_UNLIT] as GLTFMaterialsUnlitExtension;
      materialType = kmuExtension.getMaterialType();
      pending.push(kmuExtension.extendParams(materialParams, materialDef, this));
    } else {
      const { baseColorFactor, baseColorTexture, metallicFactor, metallicRoughnessTexture, roughnessFactor } = pbrMetallicRoughness;

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

    if (materialDef.doubleSided === true) {
      materialParams.side = DoubleSide;
    }

    const alphaMode = materialDef.alphaMode ?? ALPHA_MODES.OPAQUE;

    if (alphaMode === ALPHA_MODES.BLEND) {
      materialParams.transparent = true;
      materialParams.depthWrite = false;
    } else {
      materialParams.transparent = false;

      if (alphaMode === ALPHA_MODES.MASK) {
        materialParams.alphaTest = materialDef.alphaCutoff ?? 0.5;
      }
    }

    if (materialDef.normalTexture !== undefined && materialType !== MeshBasicMaterial) {
      pending.push(this.assignTexture(materialParams, 'normalMap', materialDef.normalTexture));
      materialParams.normalScale = new Vector2(1, 1);

      if (materialDef.normalTexture.scale !== undefined) {
        const scale = materialDef.normalTexture.scale;
        materialParams.normalScale.set(scale, scale);
      }
    }

    if (materialDef.occlusionTexture !== undefined && materialType !== MeshBasicMaterial) {
      pending.push(this.assignTexture(materialParams, 'aoMap', materialDef.occlusionTexture));

      if (materialDef.occlusionTexture.strength !== undefined) {
        materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;
      }
    }

    if (materialDef.emissiveFactor !== undefined && materialType !== MeshBasicMaterial) {
      materialParams.emissive = new Color().fromArray(materialDef.emissiveFactor);
    }

    if (materialDef.emissiveTexture !== undefined && materialType !== MeshBasicMaterial) {
      pending.push(this.assignTexture(materialParams, 'emissiveMap', materialDef.emissiveTexture, 3001));
    }

    return Promise.all(pending).then(() => {
      console.log('material', materialType.name, materialParams);
      const material = new materialType(materialParams);

      if (materialDef.name) {
        material.name = materialDef.name;
      }

      assignExtrasToUserData(material, materialDef);
      this.associations.set(material, { materials: index });

      if (materialDef.extensions) {
        // addUnknownExtensionsToUserData(extensions, material, materialDef);
      }

      return material;
    });
  }

  public assignFinalMaterial(component: MeshComponent): any {

  }

  public async loadCamera(index: number): Promise<any> {

  }

  public async loadGeometries(primitives: GLTFPrimitive[]): Promise<BufferGeometry[]> {
    const self = this;
    const pending = [];

    async function createDracoPrimitive(primitive: GLTFPrimitive): Promise<any> {
      return (self.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION] as GLTFDracoMeshCompressionExtension)
        .decodePrimitive(primitive, self)
        .then((geometry: BufferGeometry) => {
          return addPrimitiveAttributes(geometry, primitive, self);
        });
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
    const { primitives } = meshDef;
    const pending = [];

    for (let i = 0; i < primitives.length; i++) {
      pending.push(primitives[i].material === undefined ? createDefaultMaterial(this.cache) : this.getDependency('material', primitives[i].material));
    }

    pending.push(this.loadGeometries(primitives));

    return Promise.all(pending).then((results) => {
      console.log('loadMesh results', results);
      const materials = results.slice(0, results.length - 1);
      const geometries = results[results.length - 1];
      const meshRegisterCallbacks: GLTFParserRegisterComponentCallback[] = [];
      console.log('loadMesh materials', materials);
      console.log('loadMesh geometries', geometries);
      for (let i = 0; i < geometries.length; i++) {
        const geometry = geometries[i];
        const primitive = primitives[i];
        const material = materials[i];

        meshRegisterCallbacks.push(async (actor) => {
          console.log('loadMesh meshRegisterCallback');
          let component: MeshComponent;

          if (
            primitive.mode === WEBGL_CONSTANTS.TRIANGLES
            || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP
            || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN
            || primitive.mode === undefined
          ) {
            if (false) {
              component = actor.addComponent(SkinnedMeshComponent, geometry, material);
              // component.normalizeSkinWeights();
            } else {
              component = actor.addComponent(MeshComponent, geometry, material);
            }
          } else {
            component = actor.addComponent(MeshComponent, geometry, material);
          }
          console.log('loadMesh material', material);
          console.log('loadMesh component', component);
          if (Object.keys(component.geometry!.morphAttributes).length > 0) {
            updateMorphTargets(component, meshDef);
          }

          assignExtrasToUserData(component, meshDef);

          if (primitive.extensions) {
          // addUnknownExtensionsToUserData(this.extensions, component, primitive);
          }

          // this.assignFinalMaterial(component);

          this.associations.set(component, {
            meshes: index,
            primitives: i,
          });

          return component;
        });
      }
      console.log('loadMesh meshRegisterCallbacks', meshRegisterCallbacks);
      return meshRegisterCallbacks;
    });
  }

  public async loadSkin(index: number): Promise<any> {}

  public async loadNode(index: number): Promise<GLTFParserRegisterComponentCallback> {
    const { children = [], skin } = this.data.nodes[index];

    return async (actor: Actor, parent?: SceneComponent) => {
      const pending: Promise<GLTFParserRegisterComponentCallback>[] = [this.loadNodeShallow(index)];

      for (let i = 0; i < children.length; i++) {
        pending.push(this.getDependency('node', children[i]));
      }

      return Promise.all(pending).then(async ([registerComponent, ...children]) => {
        const component = await registerComponent(actor, parent);

        if (skin) {
          const skeleton = await this.getDependency('skin', skin);
          // if (component.isSkinnedMesh) component.bind(skeleton, identityMatrix)
        }

        for (let i = 0; i < children.length; i++) {
          const registerChildComponent = children[i];
          await registerChildComponent(actor, component);
        }

        return component;
      });
    };
  }

  private async loadNodeShallow(index: number): Promise<GLTFParserRegisterComponentCallback> {
    const { camera, extensions, matrix, mesh, name = '', rotation, scale, translation } = this.data.nodes[index];
    const pending: Promise<GLTFParserRegisterComponentCallback[]>[] = [];
    console.log('loadMesh loadNodeShallow', this.data.nodes[index]);
    if (mesh !== undefined) {
      pending.push(this.getDependency('mesh', mesh));
    }

    if (camera !== undefined) {
      pending.push(this.getDependency('camera', camera));
    }

    return Promise.all(pending).then(([meshRegisterCallbacks, camera]) => async (actor: Actor, parent?: SceneComponent) => {
      const components: SceneComponent[] = [];

      for (let i = 0; i < meshRegisterCallbacks.length; i++) {
        const registerComponent = meshRegisterCallbacks[i];
        const component = await registerComponent(actor);

        component.name = name;
        // assignExtrasToUserData(component, nodeDef);

        if (extensions) {
        // addUnknownExtensionsToUserData(extensions, node, nodeDef);
        }

        if (matrix) {
          // component.applyMatrix4(new Matrix4().fromArray(matrix))
        } else {
          if (translation) component.position.fromArray(translation);
          if (rotation) component.rotation.fromArray(rotation);
          if (scale) component.scale.fromArray(scale);
        }

        if (!this.associations.has(component)) {
          this.associations.set(component, {});
        }

        this.associations.get(component).nodes = index;

        components.push(component);
      }

      if (components.length === 1) {
        if (parent) {
          components[0].attachToComponent(parent);
        }
        return components[0];
      } else {
        const group = actor.addComponent(SceneComponent);

        for (let i = 0; i < components.length; i++) {
          components[i].attachToComponent(group);
        }

        if (parent) {
          group.attachToComponent(parent);
        }

        return group;
      }
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

        for (let i = 0, il = sparseIndices.length; i < il; i++) {
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

      if (typeof texCoord !== 'undefined' && texCoord > 0) {
        texture = texture.clone();
        texture.channel = texCoord;
      }

      const transformExt = this.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM] as GLTFTextureTransformExtension;

      if (transformExt) {
        const transformData = extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM] ?? {};
        this.associations.set(transformExt.extendTexture(texture, transformData), this.associations.get(texture));
      }

      if (encoding && 'colorSpace' in texture) {
        texture.colorSpace = encoding === 3001 ? 'srgb' : 'srgb-linear';
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

function assignExtrasToUserData(object: Record<string, any>, { extras }: GLTFObject): void {
  if (extras) {
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

  const { attributes, indices, targets = [] } = primitiveDef;

  for (const prop in attributes) {
    const attr = prop as keyof typeof ATTRIBUTES;
    const threeAttributeName = ATTRIBUTES[attr] ?? attr.toLowerCase();

    if (threeAttributeName in geometry.attributes) {
      continue;
    }

    pending.push(assignAttributeAccessor(attributes[attr], threeAttributeName));
  }

  if (typeof indices !== 'undefined' && !geometry.index) {
    pending.push(
      parser.getDependency('accessor', indices).then((accessor: BufferAttribute) => {
        geometry.setIndex(accessor);
      })
    );
  }

  assignExtrasToUserData(geometry, primitiveDef);
  computeBounds(geometry, primitiveDef, parser);

  return Promise.all(pending).then(() => addMorphTargets(geometry, targets, parser));
}

function computeBounds(geometry: BufferGeometry, { attributes, targets }: GLTFPrimitive, parser: GLTFParser): void {
  if (typeof attributes.POSITION === 'undefined') {
    return;
  }

  const box = new Box3();
  const sphere = new Sphere();
  const accessor = parser.data.accessors[attributes.POSITION];
  const min = accessor.min;
  const max = accessor.max;

  if (typeof min !== 'undefined' && typeof max !== 'undefined') {
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

      if (typeof target.POSITION !== 'undefined') {
        const accessor = parser.data.accessors[target.POSITION];
        const min = accessor.min;
        const max = accessor.max;

        if (typeof min !== 'undefined' && typeof max !== 'undefined') {
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

class GLTFMaterialsClearcoatExtension implements GLTFLoaderExtension {
  public readonly name: string = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;

  constructor(private readonly parser: GLTFParser) {}

  public getMaterialType(materialIndex: number): any {
    const materialDef = this.parser.data.materials[materialIndex];

    if (!materialDef.extensions?.[this.name]) {
      return null;
    }

    // return MeshPhysicalMaterial;
    return MeshBasicMaterial;
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
