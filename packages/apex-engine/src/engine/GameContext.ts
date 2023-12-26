import { type IInjectibleService, InstantiationService } from '../platform/di/common/InstantiationService';
import GameWorker from './GameWorker?worker';

export class GameContext implements IGameContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  constructor() {
    this.worker = new GameWorker();
  }

  public async init() {
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }
}

export interface IGameContext extends IInjectibleService {}

export const IGameContext = InstantiationService.createDecorator<IGameContext>('GameContext');
