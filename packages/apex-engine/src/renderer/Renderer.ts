import { Camera, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

import { EngineUtils } from 'src/engine';
import { SceneComponent } from 'src/engine/components';

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
      this.tickFunctions.add(component.tick.bind(component));
    }
  }

  private readonly webGLRenderer: WebGLRenderer;

  public camera: Camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

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

    window.addEventListener('resize', this.handleWindowResize.bind(this));

    Renderer.instance = this;
  }

  public render() {
    //todo: This should probably be moved into the "Container" file, see below.
    document.body.style.overflow = 'hidden';
    //todo: The container can be other than `document.body`
    document.body.appendChild(this.webGLRenderer.domElement);

    this.tick();
  }

  private tick() {
    requestAnimationFrame(this.tick.bind(this));

    for (const tickFn of Array.from(Renderer.tickFunctions)) {
      tickFn();
    }

    this.webGLRenderer.render(this.scene, this.camera);
  }

  private handleWindowResize() {
    const { innerHeight, innerWidth } = window;

    this.webGLRenderer.setSize(innerWidth, innerHeight);

    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
    }

    if (this.camera instanceof OrthographicCamera) {
      this.camera.left = innerWidth / 2;
      this.camera.right = innerWidth / -2;
      this.camera.top = innerHeight / 2;
      this.camera.bottom = innerHeight / -2;
    }
  }
}
