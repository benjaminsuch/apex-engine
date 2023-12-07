import { IConsoleLogger } from '../../logging/common';
import { TripleBuffer } from '../../memory/common';

const IS_RENDER_THREAD = typeof window === 'undefined';

export class RenderingInfo {
  private static readonly BUFFER_SIZE: number = Uint32Array.BYTES_PER_ELEMENT;

  private readonly buffer: ArrayBuffer;

  private readonly byteView: Uint8Array;

  private readonly dataView: DataView;

  private readonly views: [DataView, DataView, DataView];

  get currentFrame() {
    const idx = this.tripleBuffer.getReadBufferIndex();
    return this.views[idx].getUint32(0, true);
  }

  constructor(
    flags: Uint8Array,
    private readonly tripleBuffer: TripleBuffer = new TripleBuffer(
      flags,
      RenderingInfo.BUFFER_SIZE
    ),
    private readonly messagePort: MessagePort,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    const size = this.tripleBuffer ? this.tripleBuffer.byteLength : RenderingInfo.BUFFER_SIZE;

    this.buffer = new ArrayBuffer(size);
    this.byteView = new Uint8Array(this.buffer);
    this.dataView = new DataView(this.buffer);
    this.views = [
      new DataView(this.tripleBuffer.buffers[0]),
      new DataView(this.tripleBuffer.buffers[1]),
      new DataView(this.tripleBuffer.buffers[2])
    ];
  }

  public tick({ id }: any) {
    if (IS_RENDER_THREAD) {
      this.dataView.setUint32(0, id, true);
      this.tripleBuffer.copyToWriteBuffer(this.byteView);
    }
  }

  public init() {
    if (IS_RENDER_THREAD) {
      this.messagePort.postMessage({ type: 'running', data: this.tripleBuffer });
    }
  }
}
