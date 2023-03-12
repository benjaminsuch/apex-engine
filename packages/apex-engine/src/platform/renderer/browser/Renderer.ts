import { WorkerThread } from '../../../platform/worker/browser';

export class Renderer {
  private static instance?: Renderer;

  private renderWorker: WorkerThread;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of Renderer available.`);
    }
    return this.instance;
  }

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error(`An instance of the renderer already exists.`);
    }

    if (Renderer.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    this.renderWorker = new WorkerThread('./workers/renderWorker.js');

    Renderer.instance = this;
  }

  public async init() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;

    if (canvas) {
      const offscreenCanvas = canvas.transferControlToOffscreen();
      this.renderWorker.postMessage({ type: 'init', canvas: offscreenCanvas }, [offscreenCanvas]);
    }

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  private handleWindowResize() {
    const { innerHeight, innerWidth } = window;

    this.renderWorker.postMessage({ type: 'resize', height: innerHeight, width: innerWidth });

    /*if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
    }

    if (this.camera instanceof OrthographicCamera) {
      this.camera.left = innerWidth / 2;
      this.camera.right = innerWidth / -2;
      this.camera.top = innerHeight / 2;
      this.camera.bottom = innerHeight / -2;
    }*/
  }
}
