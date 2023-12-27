import { type ApexEngine } from './ApexEngine';

export class GameInstance {
  constructor(private readonly engine: ApexEngine) {}

  public init(): void {

  }

  public start(): void {
    this.engine.loadMap(DEFAULT_MAP).then(() => {
      console.log('Default map loaded.');
    });
  }
}
