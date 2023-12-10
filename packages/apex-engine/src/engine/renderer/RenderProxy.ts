import { TripleBuffer } from '../../platform/memory/common';
import { getClassSchema, isPropSchema } from '../class';
import { RenderRPCTask } from './tasks';
import { type Renderer, type IRenderTickContext } from './Renderer';

export abstract class RenderProxy {
  public name: string = '';

  public readonly isProxy: boolean = true;

  constructor(
    args: unknown[] = [],
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

                for (let i = 0; i < size / arrayType.BYTES_PER_ELEMENT; ++i) {
                  arr.push(views[idx][getter](offset + i * arrayType.BYTES_PER_ELEMENT, true));
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
