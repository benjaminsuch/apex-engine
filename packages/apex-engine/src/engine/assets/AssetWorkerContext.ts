import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import AssetWorker from './AssetWorker?worker';

export class AssetWorkerContext implements IAssetWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  constructor(@IConsoleLogger private readonly logger: IConsoleLogger) {
    this.worker = new AssetWorker();
  }

  public async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }

  public async loadGLTF(url: string): Promise<any> {
    let timeoutId: NodeJS.Timeout;

    return new Promise<JSON>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(`Loading GLTF file took too long`);
      }, 60000);

      const handleResponse = (event: MessageEvent): void => {
        this.logger.debug('Response received from AssetWorker:', event.data);
        if (event.data.type === 'ipc-response' && event.data.originId === 1) {
          clearTimeout(timeoutId);
          this.worker.removeEventListener('message', handleResponse);
          resolve(event.data.returnValue);
        }
      };

      this.worker.addEventListener('message', handleResponse);
      this.worker.postMessage({ id: 1, type: 'ipc-request', name: 'loadGLTF', params: [url] });
    });
  }
}

export interface IAssetWorkerContext extends IInjectibleService {
  loadGLTF(url: string): Promise<JSON>;
}

export const IAssetWorkerContext = InstantiationService.createDecorator<IAssetWorkerContext>('AssetWorkerContext');
