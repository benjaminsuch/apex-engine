import { Scene } from 'three';
import { DRACOLoader, type GLTF, GLTFLoader as BaseGLTFLoader, type GLTFLoaderPlugin, type GLTFParser } from 'three-stdlib';

import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';

type LoadParameters = Parameters<BaseGLTFLoader['load']>;

type OnProgress = LoadParameters[2];

export class GLTFLoader {
  private static instance?: GLTFLoader;

  public static getInstance(): GLTFLoader {
    if (!this.instance) {
      throw new Error(`There is no instance of GLTFLoader.`);
    }
    return this.instance;
  }

  private readonly loader: BaseGLTFLoader;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {
    if (GLTFLoader.instance) {
      throw new Error(`An instance of the GLTFLoader already exists.`);
    }

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    this.loader = new BaseGLTFLoader();
    this.loader.setDRACOLoader(dracoLoader);
    this.loader.register(parser => new GLTFApexEngineExtension(parser));

    GLTFLoader.instance = this;
  }

  public async load(url: string, onProgress?: OnProgress): Promise<GLTF> {
    let content: undefined | GLTF;

    // @todo: Load files for nodejs.
    if (IS_NODE) {
      const scene = new Scene().toJSON();

      return {
        asset: {},
        animations: [],
        cameras: [],
        scene: {
          children: [],
          ...scene,
        },
        scenes: [],
        parser: {} as any,
        userData: {},
      };
    }

    try {
      content = await this.loader.loadAsync(`${url}.glb`, onProgress);
    } catch {
      content = await this.loader.loadAsync(`${url}.gltf`, onProgress);
    }

    this.logger.debug(this.constructor.name, `Content loaded:`, content);

    return content;
  }
}

export class GLTFApexEngineExtension implements GLTFLoaderPlugin {
  public readonly name: string = 'ApexEngine_GLTF_Extension';

  constructor(private readonly parser: GLTFParser) {

  }

  public async beforeRoot(): Promise<void> {
    console.log('beforeRoot');
  }

  public async afterRoot(result: GLTF): Promise<void> {
    console.log('afterRoot', result);
  }

  public async loadTexture(textureIndex: number): Promise<any> {
    console.log('loadTexture');
  }
}
