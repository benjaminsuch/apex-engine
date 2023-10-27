import { IRenderer } from '../common';

export interface BrowserRendererOptions {
  runOnMainThread?: boolean;
}

export class BrowserRenderer implements IRenderer {
  declare readonly _injectibleService: undefined;

  private static instance?: BrowserRenderer;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of BrowserRenderer available.`);
    }
    return this.instance;
  }

  private canvas?: HTMLCanvasElement;

  private isInitialized = false;

  constructor(private readonly options: BrowserRendererOptions = { runOnMainThread: false }) {
    if (typeof window === 'undefined') {
      throw new Error(`Cannot create an instance of Renderer: "window" is undefined.`);
    }

    if (BrowserRenderer.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    BrowserRenderer.instance = this;
  }

  public async init() {
    if (this.isInitialized) {
      return;
    }

    this.canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;
    this.isInitialized = true;

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  private handleWindowResize() {}
}
