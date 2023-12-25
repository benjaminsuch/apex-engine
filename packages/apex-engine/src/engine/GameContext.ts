import { type IInjectibleService, InstantiationService } from '../platform/di/common/InstantiationService';
import { AbstractWorkerInitiator } from './AbstractWorkerInitiator';
import GameWorker from './GameWorker?worker';

export class GameContext extends AbstractWorkerInitiator implements IGameContext {
  declare readonly _injectibleService: undefined;

  constructor() {
    super(new GameWorker());
  }

  public async init() {
    return Promise.all([this.workerReady(), new Promise<void>((resolve, reject) => {
      resolve();
    })]);
  }
}

export interface IGameContext extends IInjectibleService {}

export const IGameContext = InstantiationService.createDecorator<IGameContext>('GameContext');
