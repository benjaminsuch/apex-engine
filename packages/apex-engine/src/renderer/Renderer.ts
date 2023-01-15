import { EngineUtils } from 'src/engine';
import { SceneComponent } from 'src/engine/components';
import { Camera, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

export class Renderer {
  private static instance?: Renderer;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of Renderer available.`);
    }
    return this.instance;
  }

  private static readonly tickFunctions: Set<Function> = new Set();

  public static registerTickFunction(component: SceneComponent) {
    if (EngineUtils.hasDefinedTickMethod(component)) {
      this.tickFunctions.add(component.tick);
    }
  }

  private readonly webGLRenderer: WebGLRenderer;

  public camera: Camera = new PerspectiveCamera();

  public scene: Scene = new Scene();

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error(
        `Cannot create an instance of Renderer: requestAnimationFrame() is not available.`
      );
    }

    if (Renderer.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    this.webGLRenderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.webGLRenderer.setSize(window.innerWidth, window.innerHeight);

    Renderer.instance = this;
  }

  public render() {
    document.body.appendChild(this.webGLRenderer.domElement);
    this.tick();
  }

  private tick() {
    requestAnimationFrame(this.tick.bind(this));
  }
}
