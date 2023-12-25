import { type IInjectibleService, InstantiationService } from '../platform/di/common/InstantiationService';
import { AbstractWorkerInitiator } from './AbstractWorkerInitiator';
import AssetWorker from './AssetWorker?worker';

export class AssetLoader extends AbstractWorkerInitiator implements IInjectibleService {
  declare readonly _injectibleService: undefined;

  constructor() {
    super(new AssetWorker());
  }

  public async init() {
    return Promise.all([this.workerReady(), new Promise<void>((resolve, reject) => {
      resolve();
    })]);
  }
}

export interface IAssetLoader extends IInjectibleService {}

export const IAssetLoader = InstantiationService.createDecorator<IAssetLoader>('AssetLoader');
