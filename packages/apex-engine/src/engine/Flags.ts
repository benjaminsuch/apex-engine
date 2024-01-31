import { EProxyThread } from './core/class/specifiers/proxy';

export class Flags {
  public static GAME_FLAGS: Uint8Array = new Uint8Array(
    new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  ).fill(0x6);

  public static PHYSICS_FLAGS: Uint8Array = new Uint8Array(
    new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  ).fill(0x6);

  public static RENDER_FLAGS: Uint8Array = new Uint8Array(
    new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  ).fill(0x6);

  public static getFlagsByThread(thread: EProxyThread): Uint8Array {
    if (thread === EProxyThread.Game) return this.GAME_FLAGS;
    if (thread === EProxyThread.Physics) return this.PHYSICS_FLAGS;
    if (thread === EProxyThread.Render) return this.RENDER_FLAGS;

    throw new Error(`Cannot find flags for thread.`);
  }
}
