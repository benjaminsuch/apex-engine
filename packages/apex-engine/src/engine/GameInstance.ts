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

  constructor(private readonly engine: ApexEngine) {}

  public init() {
    this.world = new World();
    this.world.init(this);
  }

  public start() {
    this.engine.loadLevel(DEFAULT_LEVEL).then(() => {
      this.getWorld().beginPlay();
    });
  }

  public createPlayer(withPlayerController: boolean = false) {
    if (this.player) {
      throw new Error(`A player already exists.`);
    }

    this.player = new Player();

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
            console.warn(
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
