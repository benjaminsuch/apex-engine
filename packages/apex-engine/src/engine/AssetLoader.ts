import { type IInjectibleService, InstantiationService } from '../platform/di/common/InstantiationService';
import AssetWorker from './AssetWorker?worker';

export class AssetLoader implements IAssetLoader {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  constructor() {
    this.worker = new AssetWorker();
  }

  public async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }

  public async loadGLTF(url: string): Promise<any> {
    let timeoutId: NodeJS.Timeout;

    return new Promise<void>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(`Loading GLTF file took too long`);
      }, 60000);

      const handleResponse = (event: MessageEvent): void => {
        if (event.data.id === 1) {
          clearTimeout(timeoutId);
          this.worker.removeEventListener('message', handleResponse);
          resolve();
        }
      };

      this.worker.addEventListener('message', handleResponse);
      this.worker.postMessage({ id: 1, type: 'ipc', name: 'loadGLTF', params: [url] });
    });
  }
}

export interface IAssetLoader extends IInjectibleService {
  loadGLTF(url: string): Promise<any>;
}

export const IAssetLoader = InstantiationService.createDecorator<IAssetLoader>('AssetLoader');
