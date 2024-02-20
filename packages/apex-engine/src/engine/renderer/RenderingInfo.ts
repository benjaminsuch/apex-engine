import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { TripleBuffer } from '../core/memory/TripleBuffer';

const viewContent = ['frames', 'delta', 'elapsed'];

/**
 * A separate class to store the info in a triple buffer to make it available
 * for the game-thread. The class is used on both threads, except that only the
 * render-thread writes into the buffer.
 */
export class RenderingInfo {
  private static readonly BUFFER_SIZE: number = viewContent.length * Float32Array.BYTES_PER_ELEMENT;

  private readonly buffer: ArrayBuffer;

  private readonly byteView: Uint8Array;

  private readonly dataView: DataView;

  private readonly views: [DataView, DataView, DataView];

  public get frames(): number {
    const idx = this.tripleBuffer.getReadBufferIndex();
    return this.views[idx].getUint32(0, true);
  }

  public get delta(): number {
    const idx = this.tripleBuffer.getReadBufferIndex();
    return this.views[idx].getUint32(4, true);
  }

  public get elapsed(): number {
    const idx = this.tripleBuffer.getReadBufferIndex();
    return this.views[idx].getUint32(8, true);
  }

  constructor(
    flags: Uint8Array,
    private readonly tripleBuffer: TripleBuffer = new TripleBuffer(flags, RenderingInfo.BUFFER_SIZE),
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    const size = this.tripleBuffer.byteLength;
    const buffers = this.tripleBuffer.buffers;

    this.buffer = new ArrayBuffer(size);
    this.byteView = new Uint8Array(this.buffer);
    this.dataView = new DataView(this.buffer);
    this.views = [new DataView(buffers[0]), new DataView(buffers[1]), new DataView(buffers[2])];
  }

  public tick({ id, delta, elapsed }: any): void {
    if (IS_WORKER && !IS_NODE) {
      this.dataView.setUint32(0, id, true);
      this.dataView.setFloat32(4, delta, true);
      this.dataView.setFloat32(8, elapsed, true);
      this.tripleBuffer.copyToWriteBuffer(this.byteView);
    }
  }

  public init(): void {
    if (IS_WORKER && !IS_NODE) {
      this.logger.debug(this.constructor.name, `Initialize`);
      self.postMessage({ type: 'init-response', data: this.tripleBuffer });
    }
  }
}
