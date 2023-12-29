import * as Comlink from 'comlink';
import { type GLTF } from 'three-stdlib';

import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import AssetWorker from './AssetWorker?worker';

export class AssetWorkerContext implements IAssetWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IAssetWorkerContext>;

  constructor(@IConsoleLogger private readonly logger: IConsoleLogger) {
    this.worker = new AssetWorker();
    this.comlink = Comlink.wrap<IAssetWorkerContext>(this.worker);
  }

  public async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }

  public async loadGLTF(url: string): Promise<GLTFResult> {
    return this.comlink.loadGLTF(url);
  }
}

export type GLTFResult = Pick<GLTF, 'animations' | 'scene'>;

export interface IAssetWorkerContext extends IInjectibleService {
  loadGLTF(url: string): Promise<GLTFResult>;
}

export const IAssetWorkerContext = InstantiationService.createDecorator<IAssetWorkerContext>('AssetWorkerContext');
