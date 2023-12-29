import { DRACOLoader, type GLTF, GLTFLoader as BaseGLTFLoader } from 'three-stdlib';

export type GLTFOnLoadResult = Pick<GLTF, 'animations' | 'cameras' | 'scenes'>;

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
    onLoad: (gltf: GLTFOnLoadResult) => void,
    onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined,
    onError?: ((event: ErrorEvent) => void) | undefined
  ): void {
    this.loader.load(
      url,
      (gltf) => {
        const { animations, cameras, scenes } = gltf;
        onLoad({ animations, cameras, scenes });
      },
      onProgress,
      onError
    );
  }
}
