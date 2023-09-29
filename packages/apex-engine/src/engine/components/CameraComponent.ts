import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { SceneComponent } from './SceneComponent';

export class CameraComponent extends SceneComponent {
  readonly #buffer: ArrayBufferLike;

  readonly #data: Float32Array;

  /**
   * Buffer offset: 0
   */
  #fov: number = 50;

  get fov() {
    return this.#data[0];
  }

  set fov(val) {
    this.#data.set([val]);
    this.#fov = this.#data[0];
  }

  /**
   * Buffer offset: 1
   */
  #aspect: number = 1;

  get aspect() {
    return this.#data[1];
  }

  set aspect(val) {
    this.#data.set([val], 1);
    this.#aspect = this.#data[1];
  }

  /**
   * Buffer offset: 2
   */
  #far: number = 2000;

  get far() {
    return this.#data[2];
  }

  set far(val) {
    this.#data.set([val], 2);
    this.#far = this.#data[2];
  }

  /**
   * Buffer offset: 3
   */
  #near: number = 0.1;

  get near() {
    return this.#data[3];
  }

  set near(val) {
    this.#data.set([val], 3);
    this.#near = this.#data[3];
  }

  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);

    const Buffer = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : ArrayBuffer;

    this.#buffer = new Buffer(4 * Float32Array.BYTES_PER_ELEMENT);
    this.#data = new Float32Array(this.#buffer);
    this.#data.set([50, 1, 2000, 0.1]);
  }
}
