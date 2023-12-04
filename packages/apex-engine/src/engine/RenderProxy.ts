import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { TripleBuffer } from '../platform/memory/common';
import {
  type IRenderProxyManager,
  type IRenderTickContext,
  RenderProxyTask,
  type Renderer,
  TRenderRPCData
} from '../platform/renderer/common';
import { getClassSchema, isPropSchema } from './class';

export abstract class RenderProxy {
  public name: string = '';

  public readonly isProxy: boolean = true;

  constructor(
    tb: TripleBuffer,
    public readonly id: number,
    protected readonly messagePort: MessagePort | null = null,
    protected readonly renderer: Renderer
  ) {
    const originClass = Reflect.getMetadata('proxy:origin', this.constructor);
    const schema = getClassSchema(originClass);

    if (!schema) {
      console.warn(`Unable to find the schema for "${originClass.name}".`);
      return;
    }

    const views = [
      new DataView(tb.buffers[0]),
      new DataView(tb.buffers[1]),
      new DataView(tb.buffers[2])
    ];

    for (const key in schema) {
      const propSchema = schema[key];

      if (isPropSchema(propSchema)) {
        const { arrayType, isArray, offset, size, type } = propSchema;

        let accessors: { get: (this: RenderProxy) => any } | undefined;

        if (type === 'string') {
        } else if (type === 'ref') {
          accessors = {
            get(this) {
              const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
              return this.renderer.proxyManager.getProxy(views[idx].getUint32(offset, true));
            }
          };
        } else if (type === 'boolean') {
          accessors = {
            get(this) {
              const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
              return Boolean(views[idx].getUint8(offset));
            }
          };
        } else {
          accessors = {
            get(this) {
              const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
              const getter = getters.get(arrayType) as keyof typeof DataView;

              if (isArray) {
                const arr: number[] = [];

                for (let i = 0; i < size; ++i) {
                  arr.push(views[idx][getter](offset, true));
                }

                return arr;
              } else {
                return views[idx][getter](offset, true);
              }
            }
          };
        }

        if (accessors) {
          Object.defineProperty(this, key, accessors);
        }
      }
    }

    if (this.messagePort) {
      this.messagePort.addEventListener('message', event => {
        console.log(`${this.constructor.name} (${this.id})`, `Received message:`, event.data);

        const { type } = event.data;

        if (type === 'rpc') {
          this.renderer.proxyManager.queueTask(RenderRPCTask, event.data, this);
        }
      });
      this.messagePort.start();
    }
  }

  public tick(tick: IRenderTickContext) {}
}

const getters = new Map<TypedArray, string>([
  [Float32Array, 'getFloat32'],
  [Int8Array, 'getInt8'],
  [Int16Array, 'getInt16'],
  [Int32Array, 'getInt32'],
  [Uint8Array, 'getUint8'],
  [Uint16Array, 'getUint16'],
  [Uint32Array, 'getUint32']
]);

class RenderRPCTask extends RenderProxyTask<TRenderRPCData> {
  constructor(
    public override readonly data: TRenderRPCData,
    private readonly proxy: RenderProxy | undefined = undefined,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(data, instantiationService, logger);
  }

  public run(proxyManager: IRenderProxyManager) {
    const { name, params, tick } = this.data;

    // if (proxyManager.currentTick.id !== tick) {
    //   //todo: `IS_DEV` does not exist in worker environment (this needs to be fixed in abt/cli.ts).
    //   this.logger.info(
    //     this.constructor.name,
    //     `The render tick (${proxyManager.currentTick.id}) does not match the game tick (${tick}). The task will be deferred to the next tick.`
    //   );
    //   return false;
    // }

    if (!this.proxy) {
      this.logger.info(
        this.constructor.name,
        `RPC execution failed: The target for this rpc does not exist yet. Task will be deferred to the next tick.`
      );
      return false;
    }

    const method = this.proxy[name];

    if (!method) {
      this.logger.warn(
        this.constructor.name,
        `RPC execution failed: A method "${name}" does not exist on ${this.proxy.constructor.name}.`
      );
    } else {
      method.apply(this.proxy, params);
    }

    return true;
  }
}
