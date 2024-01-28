import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { TripleBuffer } from '../core/memory/TripleBuffer';

/**
 * A separate class to store the info in a triple buffer to make it available
 * for the game-thread. The class is used on both threads, except that only the
 * render-thread writes into the buffer.
 */
export class PhysicsInfo {
  private static readonly BUFFER_SIZE: number = Uint32Array.BYTES_PER_ELEMENT;

  private readonly buffer: ArrayBuffer;

  private readonly byteView: Uint8Array;

  private readonly dataView: DataView;

  private readonly views: [DataView, DataView, DataView];

  get simulationState(): number {
    const idx = IS_WORKER ? this.tripleBuffer.getWriteBufferIndex() : this.tripleBuffer.getReadBufferIndex();
    return this.views[idx].getUint8(0);
  }

  set simulationState(val: number) {
    if (IS_WORKER) {
      this.dataView.setUint8(0, val);
      this.tripleBuffer.copyToWriteBuffer(this.byteView);
    }
  }

  constructor(
    flags: Uint8Array,
    public readonly tripleBuffer: TripleBuffer = new TripleBuffer(flags, PhysicsInfo.BUFFER_SIZE),
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    const size = this.tripleBuffer ? this.tripleBuffer.byteLength : PhysicsInfo.BUFFER_SIZE;
    const buffers = this.tripleBuffer.buffers;

    this.buffer = new ArrayBuffer(size);
    this.byteView = new Uint8Array(this.buffer);
    this.dataView = new DataView(this.buffer);
    this.views = [new DataView(buffers[0]), new DataView(buffers[1]), new DataView(buffers[2])];
  }
}
