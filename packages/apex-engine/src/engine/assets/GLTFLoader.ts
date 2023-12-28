import { DRACOLoader, type GLTF, GLTFLoader as BaseGLTFLoader } from 'three-stdlib';

export class GLTFLoader {
  private readonly loader: BaseGLTFLoader;

  constructor() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });

    this.loader = new BaseGLTFLoader();
    this.loader.setDRACOLoader(dracoLoader);
  }

  public load(
    url: string,
    onLoad: (gltf: Pick<GLTF, 'animations' | 'scene'>) => void,
    onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined,
    onError?: ((event: ErrorEvent) => void) | undefined
  ): void {
    this.loader.load(
      url,
      (gltf) => {
        const { animations, scene } = gltf;
        onLoad({ animations, scene });
      },
      onProgress,
      onError
    );
  }
}
