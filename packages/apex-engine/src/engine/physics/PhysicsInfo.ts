import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { TripleBuffer } from '../core/memory/TripleBuffer';

export class PhysicsInfo {
  private static readonly BUFFER_SIZE: number = Uint32Array.BYTES_PER_ELEMENT;

  private readonly buffer: ArrayBuffer;

  private readonly byteView: Uint8Array;

  private readonly dataView: DataView;

  private readonly views: [DataView, DataView, DataView];

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
