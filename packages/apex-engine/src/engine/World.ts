import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type GameInstance } from './GameInstance';

export class World {
  private gameInstance: GameInstance | null = null;

  public getGameInstance(): GameInstance {
    if (!this.gameInstance) {
      throw new Error(`No game instance set.`);
    }
    return this.gameInstance;
  }

  public isInitialized: boolean = false;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {}

  public init(gameInstance: GameInstance): void {
    this.logger.debug(this.constructor.name, 'Initialize');

    this.gameInstance = gameInstance;
    this.isInitialized = true;
  }

  public beginPlay(): void {
    this.logger.debug(this.constructor.name, 'Begin Play');
  }
}
