import { TripleBuffer } from '../platform/memory/common';
import { getClassSchema } from './class';

export abstract class RenderProxy {
  constructor(
    public readonly id: number,
    tb: TripleBuffer,
    protected readonly proxyRegistry: Map<number, InstanceType<TClass>>
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
      const { arrayType, isArray, offset, size, type } = schema[key];

      let accessors: { get: (this: RenderProxy) => any } | undefined;

      if (type === 'string') {
      } else if (type === 'ref') {
        accessors = {
          get(this) {
            const idx = TripleBuffer.getReadBufferIndexFromFlags(tb.flags);
            return this.proxyRegistry.get(views[idx].getUint32(offset, true));
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
