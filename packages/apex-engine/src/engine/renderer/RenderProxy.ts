import { EProxyThread } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { ProxyInstance } from '../ProxyInstance';
import { type RenderWorker } from './RenderWorker';

export abstract class RenderProxy<T = any> extends ProxyInstance {
  protected abstract readonly object: T;

  public get(): T {
    return this.object;
  }

  constructor(args: unknown[] = [], tb: TripleBuffer, id: number, originThread: EProxyThread, protected readonly renderer: RenderWorker) {
    super(args, tb, id, originThread);
  }

  public setParent(id: ProxyInstance['id']): boolean {
    const parent = this.renderer.proxyManager.getProxy<RenderProxy>(id, EProxyThread.Game);

    if (!parent) {
      console.warn(`Parent (${id}) for proxy "${this.id}" not found. Trying again next tick.`);
      return false;
    }

    parent.target.object.add(this.object);

    return true;
  }
}
