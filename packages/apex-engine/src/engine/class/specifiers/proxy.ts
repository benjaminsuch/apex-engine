import { TripleBuffer } from '../../../platform/memory/common';
import { ApexEngine } from '../../ApexEngine';
import { getTargetId } from '../class';
import { id } from './id';

export const messageQueue: any[] = [];

export function proxy(proxyClass: TClass) {
  return (constructor: TClass) => {
    const schema = Reflect.getMetadata('schema', constructor);
    const bufferSize = Reflect.getMetadata('byteLength', constructor);

    class ProxyOrigin extends constructor {
      private tripleBuffer: TripleBuffer;

      private byteView: Uint8Array;

      constructor(...args: any[]) {
        super(...args);

        id(this);

        this.tripleBuffer = new TripleBuffer(ApexEngine.GAME_FLAGS, bufferSize);

        const buf = new ArrayBuffer(bufferSize);
        const dv = new DataView(buf);

        this.byteView = new Uint8Array(buf);

        for (const key in schema) {
          const { offset, size, type } = schema[key];
          const initialVal = this[key] as any;

          let accessors: { get: () => any; set: (val: any) => void } | undefined;

          switch (type) {
            case 'string':
              setString(this[key], dv, offset, size);

              accessors = {
                get() {
                  const arr = new Uint8Array(new ArrayBuffer(size));
                  arr.set(new Uint8Array(dv.buffer.slice(offset, size)));

                  return new TextDecoder().decode(arr.buffer).replace(/\u0000+$/, '');
                },
                set(val: string) {
                  setString(val, dv, offset, size);
                }
              };
              break;
            case 'float32':
              setNumber(Float32Array, initialVal, dv, offset);

              accessors = {
                get() {
                  return new Float32Array(buf.slice(offset, size));
                },
                set(val: number | Float32Array) {
                  setNumber(Float32Array, val, dv, offset);
                }
              };
              break;
            case 'int8':
              setNumber(Int8Array, initialVal, dv, offset);

              accessors = {
                get() {
                  return new Int8Array(buf.slice(offset, size));
                },
                set(val: number | Int8Array) {
                  setNumber(Int8Array, val, dv, offset);
                }
              };
              break;
            case 'int16':
              setNumber(Int16Array, initialVal, dv, offset);

              accessors = {
                get() {
                  return new Int16Array(buf.slice(offset, size));
                },
                set(val: number | Int16Array) {
                  setNumber(Int16Array, val, dv, offset);
                }
              };
              break;
            case 'int32':
              setNumber(Int32Array, initialVal, dv, offset);

              accessors = {
                get() {
                  return new Int32Array(buf.slice(offset, size));
                },
                set(val: number | Int32Array) {
                  setNumber(Int32Array, val, dv, offset);
                }
              };
              break;
            case 'uint16':
              setNumber(Uint16Array, initialVal, dv, offset);

              accessors = {
                get() {
                  return new Uint16Array(buf.slice(offset, size));
                },
                set(val: number | Uint16Array) {
                  setNumber(Uint16Array, val, dv, offset);
                }
              };
              break;
            case 'uint32':
              setNumber(Uint32Array, initialVal, dv, offset);

              accessors = {
                get() {
                  return new Uint32Array(buf.slice(offset, size));
                },
                set(val: number | Uint32Array) {
                  setNumber(Uint32Array, val, dv, offset);
                }
              };
              break;
            case 'uint8':
              setNumber(Uint8Array, initialVal, dv, offset);

              accessors = {
                get() {
                  return new Uint8Array(buf.slice(offset, size));
                },
                set(val: number | Uint8Array) {
                  setNumber(Uint8Array, val, dv, offset);
                }
              };
              break;
          }

          if (accessors) {
            Object.defineProperty(this, key, accessors);
          }
        }

        messageQueue.push({
          type: 'proxy',
          constructor: proxyClass.name,
          id: getTargetId(this),
          tb: this.tripleBuffer
        });
      }

      public tick() {
        super.tick();

        this.tripleBuffer.copyToWriteBuffer(this.byteView);
      }
    }

    Object.defineProperty(ProxyOrigin, 'name', { value: constructor.name });

    return ProxyOrigin;
  };
}

function setString(val: string, dv: DataView, offset: number, size: number) {
  const chars = new TextEncoder().encode(val);

  for (let i = 0; i < size; ++i) {
    dv.setUint8(offset + i, chars[i]);
  }
}

const setters = new Map<TypedArray, string>([
  [Float32Array, 'setFloat32'],
  [Int8Array, 'setInt8'],
  [Int16Array, 'setInt16'],
  [Int32Array, 'setInt32'],
  [Uint8Array, 'setUint8'],
  [Uint16Array, 'setUint16'],
  [Uint32Array, 'setUint32']
]);

function setNumber(
  type: TypedArray,
  val: number | InstanceType<TypedArray>,
  dv: DataView,
  offset: number
) {
  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; ++i) {
      dv[setters.get(type) as string](offset + i * type.BYTES_PER_ELEMENT, val[i]);
    }
  } else {
    dv.setUint8(offset, (val ?? 0) as number);
  }
}
