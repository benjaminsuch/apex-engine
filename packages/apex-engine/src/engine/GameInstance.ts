import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { INetDriver } from '../platform/net/common';
import { IRenderingPlatform } from '../platform/rendering/common';
import { type ApexEngine } from './ApexEngine';
import { GameMode } from './GameMode';
import { Player } from './Player';
import { World } from './World';

export class GameInstance {
  private defaultGameModeClass: typeof GameMode = GameMode;

  private gameModeClassAliases: Array<GameModeMap> = [];

  private world: World | null = null;

  public getWorld() {
    if (!this.world) {
      throw new Error(`No world set.`);
    }
    return this.world;
  }

  private player: Player | null = null;

  public getPlayer() {
    if (!this.player) {
      throw new Error(`No player set.`);
    }
    return this.player;
  }

  constructor(
    private readonly engine: ApexEngine,
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @INetDriver protected readonly netDriver: INetDriver,
    @IRenderingPlatform protected readonly renderer: IRenderingPlatform
  ) {}

  public init() {
    this.logger.debug(this.constructor.name, 'Initialize');

    this.world = this.instantiationService.createInstance(World);
    this.world.init(this);

    if (!IS_GAME) {
      this.netDriver.init(this.world);
      this.netDriver.listen();
      this.netDriver.connect();
    }
  }

  public start() {
    this.logger.debug(this.constructor.name, 'Start');
    this.engine.loadLevel(DEFAULT_LEVEL).then(() => {
      this.getWorld().beginPlay();
      this.renderer.start();
    });
  }

  public createPlayer(withPlayerController: boolean = false) {
    if (this.player) {
      throw new Error(`A player already exists.`);
    }

    this.logger.debug(this.constructor.name, 'Creating player');
    this.player = this.instantiationService.createInstance(Player);

    if (this.world && withPlayerController) {
      this.player.spawnPlayActor(this.world);
    }
  }

  public async createGameModeFromURL(url: string) {
    // We don't parse the url yet, but in the future, it should be able to load a specific
    // game mode via url parameters.
    //todo: Parse url
    const gameModeParam = '';
    let GameModeClass: typeof GameMode = this.defaultGameModeClass;

    if (gameModeParam.length > 0) {
      const gameModeMap = this.getGameModeByName(gameModeParam);

      if (gameModeMap) {
        try {
          const module = await import(gameModeMap.classFilePath);

          if (module.default) {
            GameModeClass = module.default;
          } else {
            this.logger.warn(
              this.constructor.name,
              `Unable to find default export for game mode "${gameModeMap.classFilePath}".`
            );
          }
        } catch (error) {
          throw new Error(`Unable to load game mode "${gameModeMap.classFilePath}"`);
        }
      }
    }

    return this.getWorld().spawnActor(GameModeClass);
  }

  private getGameModeByName(name: GameModeMap['name']) {
    for (const gameModeMap of this.gameModeClassAliases) {
      if (gameModeMap.name === name) {
        return gameModeMap;
      }
    }
  }
}

export class GameModeMap {
  constructor(public readonly name: string, public readonly classFilePath: string) {}
}
