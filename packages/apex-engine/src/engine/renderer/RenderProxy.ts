import { getClassSchema, isPropSchema } from '../core/class/decorators';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { type IInternalRenderWorkerContext } from './Render.worker';

export abstract class RenderProxy {
  public name: string = '';

  public readonly isProxy: boolean = true;

  constructor(
    args: unknown[] = [],
    tb: TripleBuffer,
    public readonly id: number,
    protected readonly renderer: IInternalRenderWorkerContext
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
      new DataView(tb.buffers[2]),
    ];

    for (const key in schema) {
      const propSchema = schema[key];

      if (isPropSchema(propSchema)) {
        const { arrayType, isArray, offset, size, type } = propSchema;

        let accessors: { get: (this: RenderProxy) => any } | undefined;

        if (type === 'string') {
        } else if (type === 'ref') {
          accessors = {
            get(this): RenderProxy | void {
              const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
              return this.renderer.proxyManager.getProxy(views[idx].getUint32(offset, true));
            },
          };
        } else if (type === 'boolean') {
          accessors = {
            get(this): boolean {
              const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
              return Boolean(views[idx].getUint8(offset));
            },
          };
        } else {
          accessors = {
            get(this): number | number[] {
              const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
              const getter = getters.get(arrayType) as any;

              if (isArray) {
                const arr: number[] = [];

                for (let i = 0; i < size / arrayType.BYTES_PER_ELEMENT; ++i) {
                  // @ts-ignore
                  arr.push(views[idx][getter](offset + i * arrayType.BYTES_PER_ELEMENT, true));
                }

                return arr;
              } else {
                // @ts-ignore
                return views[idx][getter](offset, true);
              }
            },
          };
        }

        if (accessors) {
          Object.defineProperty(this, key, accessors);
        }
      }
    }
  }

  public tick(tick: IEngineLoopTickContext): void {}
}

const getters = new Map<TypedArray, string>([
  [Float32Array, 'getFloat32'],
  [Int8Array, 'getInt8'],
  [Int16Array, 'getInt16'],
  [Int32Array, 'getInt32'],
  [Uint8Array, 'getUint8'],
  [Uint16Array, 'getUint16'],
  [Uint32Array, 'getUint32'],
]);
