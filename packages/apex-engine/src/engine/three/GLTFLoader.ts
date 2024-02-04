import { Scene } from 'three';
import { DRACOLoader, type GLTF, GLTFLoader as BaseGLTFLoader } from 'three-stdlib';

import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';

type LoadParameters = Parameters<BaseGLTFLoader['load']>;

type OnProgress = LoadParameters[2];

export class GLTFLoader {
  private readonly loader: BaseGLTFLoader;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    this.loader = new BaseGLTFLoader();
    this.loader.setDRACOLoader(dracoLoader);
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
