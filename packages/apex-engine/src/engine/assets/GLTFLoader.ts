import { type GLTF, GLTFLoader as BaseGLTFLoader } from 'three-stdlib';

export class GLTFLoader {
  private readonly loader: BaseGLTFLoader;

  constructor() {
    this.loader = new BaseGLTFLoader();
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
