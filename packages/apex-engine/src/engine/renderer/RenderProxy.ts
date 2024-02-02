import { type EProxyThread } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { ProxyInstance } from '../ProxyInstance';
import { type IInternalRenderWorkerContext } from './Render.worker';

export abstract class RenderProxy extends ProxyInstance {
  constructor(
    args: unknown[] = [],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    protected readonly renderer: IInternalRenderWorkerContext
  ) {
    super(args, tb, id, thread);
  }
}
