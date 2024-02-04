import { type EProxyThread } from '../core/class/specifiers/proxy';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { ProxyInstance } from '../ProxyInstance';
import { type RenderWorker } from './RenderWorker';

export abstract class RenderProxy extends ProxyInstance {
  constructor(
    args: unknown[] = [],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    protected readonly renderer: RenderWorker
  ) {
    super(args, tb, id, thread);
  }
}
