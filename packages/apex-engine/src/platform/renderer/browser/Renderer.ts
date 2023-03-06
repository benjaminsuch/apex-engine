import {
  ACESFilmicToneMapping,
  Camera,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  WebGLRenderer
} from 'three';

import { EngineUtils } from '../../../engine';
import { SceneComponent } from '../../../engine/components';
import { IRenderWorker } from '../../../platform/engine/rendering/common';
import { IConsoleLogger } from '../../../platform/logging/common';

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

  public readonly webGLRenderer: WebGLRenderer;

  public camera: Camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight);

  public scene: Scene = new Scene();

  constructor(
    @IRenderWorker private readonly renderWorker: IRenderWorker,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    if (typeof window === 'undefined') {
      throw new Error(
        `Cannot create an instance of Renderer: requestAnimationFrame() is not available.`
      );
    }

    if (Renderer.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    this.webGLRenderer = new WebGLRenderer({ antialias: true, alpha: true });

    Renderer.instance = this;
  }

  public init() {
    this.webGLRenderer.shadowMap.type = PCFSoftShadowMap;
    this.webGLRenderer.outputEncoding = sRGBEncoding;
    this.webGLRenderer.toneMapping = ACESFilmicToneMapping;
    this.webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    this.webGLRenderer.setPixelRatio(window.devicePixelRatio);

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  public tick() {
    console.log(1);
    requestAnimationFrame(this.tick);
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
