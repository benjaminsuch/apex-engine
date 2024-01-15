import { DRACOLoader, type GLTF, GLTFLoader as BaseGLTFLoader } from 'three-stdlib';

type LoadParameters = Parameters<BaseGLTFLoader['load']>;

type OnProgress = LoadParameters[2];

export class GLTFLoader {
  private readonly loader: BaseGLTFLoader;

  constructor() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    this.loader = new BaseGLTFLoader();
    this.loader.setDRACOLoader(dracoLoader);
  }

  public async load(url: string, onProgress?: OnProgress): Promise<GLTF> {
    let content: undefined | GLTF;

    try {
      content = await this.loader.loadAsync(`${url}.glb`, onProgress);
    } catch {
      content = await this.loader.loadAsync(`${url}.gltf`, onProgress);
    }

    return content;
  }
}
