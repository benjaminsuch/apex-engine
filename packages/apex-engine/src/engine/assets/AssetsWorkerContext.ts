import * as Comlink from 'comlink';

import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { type ILoadGLTFResponse } from './Assets.worker';
import AssetWorker from './Assets.worker?worker';

export class AssetsWorkerContext implements IAssetsWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IAssetsWorkerContext>;

  constructor(@IConsoleLogger private readonly logger: IConsoleLogger) {
    this.worker = new AssetWorker();
    this.comlink = Comlink.wrap<IAssetsWorkerContext>(this.worker);
  }

  public async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }

  public async loadGLTF(url: string): Promise<ILoadGLTFResponse> {
    return this.comlink.loadGLTF(url);
  }
}

export interface IAssetsWorkerContext extends IInjectibleService {
  loadGLTF(url: string): Promise<ILoadGLTFResponse>;
}

export const IAssetsWorkerContext = InstantiationService.createDecorator<IAssetsWorkerContext>('AssetsWorkerContext');
