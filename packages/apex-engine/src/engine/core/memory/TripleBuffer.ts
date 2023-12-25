/**
 * The triple buffer implementation is from thirdroom (https://github.com/matrix-org/thirdroom/tree/main) and was
 * published under the Apache 2.0 license.
 *
 * Link to the code specifically: https://github.com/matrix-org/thirdroom/blob/main/src/engine/allocator/TripleBuffer.ts
 */
export class TripleBuffer {
  public static getReadBufferIndexFromFlags(flags: Uint8Array) {
    return Atomics.load(flags, 0) & 0x3;
  }

  public static swapWriteBufferFlags(flags: Uint8Array) {
    const f = Atomics.load(flags, 0);

    while (Atomics.compareExchange(flags, 0, f, this.swapWriteWithTempAndMarkChanged(f)) === f);
  }

  public static swapReadBufferFlags(flags: Uint8Array) {
    const f = Atomics.load(flags, 0);

    do {
      if (!this.readyToRead(f)) {
        return false;
      }
    } while (Atomics.compareExchange(flags, 0, f, this.swapReadWithTemp(f)) === f);

    return true;
  }

  private static swapWriteWithTempAndMarkChanged(flags: number) {
    return 0x40 | ((flags & 0xc) << 2) | ((flags & 0x30) >> 2) | (flags & 0x3);
  }

  private static readyToRead(flags: number) {
    return (flags & 0x40) !== 0;
  }

  private static swapReadWithTemp(flags: number) {
    return (flags & 0x30) | ((flags & 0x3) << 2) | ((flags & 0xc) >> 2);
  }

  constructor(
    public readonly flags: Uint8Array = new Uint8Array(
      new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
    ).fill(0x6),
    public readonly byteLength = 1e7,
    public readonly buffers: SharedArrayBuffer[] = [
      new SharedArrayBuffer(byteLength),
      new SharedArrayBuffer(byteLength),
      new SharedArrayBuffer(byteLength),
    ],
    public readonly byteViews: Uint8Array[] = [
      new Uint8Array(buffers[0]),
      new Uint8Array(buffers[1]),
      new Uint8Array(buffers[2]),
    ]
  ) {}

  public getReadBufferIndex() {
    return Atomics.load(this.flags, 0) & 0x3;
  }

  public getReadBuffer() {
    return this.buffers[this.getReadBufferIndex()];
  }

  public getReadView() {
    return this.byteViews[this.getReadBufferIndex()];
  }

  public getWriteBufferIndex() {
    return (Atomics.load(this.flags, 0) & 0x30) >> 4;
  }

  public getWriteBuffer() {
    return this.buffers[this.getWriteBufferIndex()];
  }

  public copyToWriteBuffer(byteView: Uint8Array) {
    return this.byteViews[this.getWriteBufferIndex()].set(byteView);
  }

  public swapReadBuffer() {
    return TripleBuffer.swapReadBufferFlags(this.flags);
  }

  public swapWriteBuffer() {
    return TripleBuffer.swapWriteBufferFlags(this.flags);
  }
}
