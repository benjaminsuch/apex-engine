import { IAssetLoader } from './assets/AssetLoader';

export class ApexEngine {
  private static instance?: ApexEngine;

  public static getInstance(): ApexEngine {
    if (!this.instance) {
      throw new Error(`No instance of ApexEngine available.`);
    }
    return this.instance;
  }

  public isInitialized: boolean = false;

  constructor(@IAssetLoader private readonly assetLoader: IAssetLoader) {
    if (ApexEngine.instance) {
      throw new Error(`An instance of the ApexEngine already exists.`);
    }

    ApexEngine.instance = this;
  }

  public init(): void {
    this.isInitialized = true;
  }

  public async loadMap(url: string): Promise<void> {
    const content = await this.assetLoader.loadGLTF(url);
  }
}
