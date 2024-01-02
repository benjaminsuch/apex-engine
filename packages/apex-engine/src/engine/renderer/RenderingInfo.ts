import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { TripleBuffer } from '../core/memory/TripleBuffer';

const IS_RENDER_THREAD = typeof window === 'undefined';

export class RenderingInfo {
  private static readonly BUFFER_SIZE: number = Uint32Array.BYTES_PER_ELEMENT;

  private readonly buffer: ArrayBuffer;

  private readonly byteView: Uint8Array;

  private readonly dataView: DataView;

  private readonly views: [DataView, DataView, DataView];

  get lastFrame(): number {
    const idx = this.tripleBuffer.getReadBufferIndex();
    return this.views[idx].getUint32(0, true);
  }

  constructor(
    flags: Uint8Array,
    private readonly tripleBuffer: TripleBuffer = new TripleBuffer(flags, RenderingInfo.BUFFER_SIZE),
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    const size = this.tripleBuffer ? this.tripleBuffer.byteLength : RenderingInfo.BUFFER_SIZE;
    const buffers = this.tripleBuffer.buffers;

    this.buffer = new ArrayBuffer(size);
    this.byteView = new Uint8Array(this.buffer);
    this.dataView = new DataView(this.buffer);
    this.views = [new DataView(buffers[0]), new DataView(buffers[1]), new DataView(buffers[2])];
  }

  public tick({ id }: any): void {
    if (IS_RENDER_THREAD) {
      this.dataView.setUint32(0, id, true);
      this.tripleBuffer.copyToWriteBuffer(this.byteView);
    }
  }

  public init(): void {
    if (IS_RENDER_THREAD) {
      this.logger.debug(this.constructor.name, `Initialize`);
      self.postMessage({ type: 'init-response', data: this.tripleBuffer });
    }
  }
}
