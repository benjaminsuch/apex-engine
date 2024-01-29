import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { ProxyInstance } from '../ProxyInstance';
import { type IInternalRenderWorkerContext } from './Render.worker';

export abstract class RenderProxy extends ProxyInstance {
  constructor(
    args: unknown[] = [],
    tb: TripleBuffer,
    public override readonly id: number,
    protected readonly renderer: IInternalRenderWorkerContext
  ) {
    super(args, tb, id);
  }
}
