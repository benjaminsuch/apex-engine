import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IAssetWorkerContext } from './assets/AssetWorkerContext';
import { GameInstance } from './GameInstance';

export class ApexEngine {
  private static instance?: ApexEngine;

  public static getInstance(): ApexEngine {
    if (!this.instance) {
      throw new Error(`No instance of ApexEngine available.`);
    }
    return this.instance;
  }

  private gameInstance?: GameInstance;

  public getGameInstance(): GameInstance {
    if (!this.gameInstance) {
      throw new Error(`Cannot access GameInstance before the Engine has been initialized.`);
    }
    return this.gameInstance;
  }

  public isInitialized: boolean = false;

  constructor(@IInstantiationService protected readonly instantiationService: IInstantiationService, @IAssetWorkerContext protected readonly assetWorker: IAssetWorkerContext) {
    if (ApexEngine.instance) {
      throw new Error(`An instance of the ApexEngine already exists.`);
    }

    ApexEngine.instance = this;
  }

  public init(): void {
    this.gameInstance = this.instantiationService.createInstance(GameInstance, this);
    this.gameInstance.init();

    this.isInitialized = true;
  }

  public start(): void {
    this.getGameInstance().start();
  }

  public async loadMap(url: string): Promise<void> {
    try {
      const content = await this.assetWorker.loadGLTF(url);
      console.log('received gltf data from worker:', content);
    } catch (error) {
      console.log(error);
    }
  }
}
