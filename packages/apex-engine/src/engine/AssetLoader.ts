import { type IInjectibleService, InstantiationService } from '../platform/di/common/InstantiationService';
import AssetWorker from './AssetWorker?worker';

export class AssetLoader implements IAssetLoader {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  constructor() {
    this.worker = new AssetWorker();
  }

  public async init() {
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }
}

export interface IAssetLoader extends IInjectibleService {}

export const IAssetLoader = InstantiationService.createDecorator<IAssetLoader>('AssetLoader');
