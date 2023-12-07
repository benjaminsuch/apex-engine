export class TickContext {
  public static GAME_FLAGS: Uint8Array = new Uint8Array(
    new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  ).fill(0x6);

  public static RENDER_FLAGS: Uint8Array = new Uint8Array(
    new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  ).fill(0x6);

  public delta: number = 0;

  public elapsed: number = 0;

  public ticks: number = 0;
}
