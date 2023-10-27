import { TripleBuffer } from '../../../platform/memory/common';
import { SceneProxy } from '../../../rendering';
import { ApexEngine } from '../../ApexEngine';
import {
  getClassSchema,
  getClassSpecifiers,
  getTargetId,
  getTripleBuffer,
  setTripleBuffer
} from '../class';

export const messageQueue: any[] = [];

export function proxy() {
  return (constructor: TClass) => {
    const bufferSize = Reflect.getMetadata('byteLength', constructor);
    console.log('bufferSize', bufferSize);

    getClassSpecifiers(constructor).set('proxy', (target: InstanceType<TClass>) => {
      const schema = getClassSchema(constructor);
      console.log('schema', schema);

      if (!schema) {
        console.warn(`The target class has no schema defined.`);
        return;
      }

      let buffer = getTripleBuffer(target);

      if (!buffer) {
        buffer = new TripleBuffer(ApexEngine.GAME_FLAGS, bufferSize);
        setTripleBuffer(target, buffer);
      }

      // We can't use `tb.getWriteBuffer()` because it's only called once and has to be
      // recalled on every prop-setter call (otherwise it points to the wrong buffer).
      const buf = new ArrayBuffer(bufferSize);
      const byteView = new Uint8Array(buf);

      Reflect.defineMetadata('byteView', byteView, target);

      const dv = new DataView(buf);
      const offsets = [0];

      for (const [prop, { type, pos, size }] of Object.entries(schema)) {
        let accessors: { get: () => any; set: (val: any) => void } | undefined;

        switch (type) {
          case 'ref':
            const refId = getTargetId(target[prop]);

            if (refId) {
              dv.setUint32(offsets[pos], refId);
            }

            accessors = {
              get() {
                return SceneProxy.instances.get(dv.getUint32(offsets[pos]));
              },
              set(val: InstanceType<TClass>) {
                const refId = getTargetId(val);

                if (!refId) {
                  throw Error(`Ref has no id assigned.`);
                }

                messageQueue.push({
                  action: 'dispose',
                  id: refId
                  //tick: ?
                });

                dv.setUint32(offsets[pos], refId);
                SceneProxy.instances.set(refId, val);
              }
            };
            break;
          case 'string':
            setString(target[prop], dv, offsets[pos], size);

            accessors = {
              get() {
                const arr = new Uint8Array(new ArrayBuffer(size));
                arr.set(new Uint8Array(dv.buffer.slice(offsets[pos], size)));

                return new TextDecoder().decode(arr.buffer).replace(/\u0000+$/, '');
              },
              set(val: string) {
                setString(val, dv, offsets[pos], size);
              }
            };
            break;
          case 'float32':
            setNumber(Float32Array, target[prop], dv, offsets[pos]);

            accessors = {
              get() {
                return new Float32Array(buf.slice(offsets[pos], size));
              },
              set(val: number | Float32Array) {
                setNumber(Float32Array, val, dv, offsets[pos]);
              }
            };
            break;
          case 'int8':
            setNumber(Int8Array, target[prop], dv, offsets[pos]);

            accessors = {
              get() {
                return new Int8Array(buf.slice(offsets[pos], size));
              },
              set(val: number | Int8Array) {
                setNumber(Int8Array, val, dv, offsets[pos]);
              }
            };
            break;
          case 'int16':
            setNumber(Int16Array, target[prop], dv, offsets[pos]);

            accessors = {
              get() {
                return new Int16Array(buf.slice(offsets[pos], size));
              },
              set(val: number | Int16Array) {
                setNumber(Int16Array, val, dv, offsets[pos]);
              }
            };
            break;
          case 'int32':
            setNumber(Int32Array, target[prop], dv, offsets[pos]);

            accessors = {
              get() {
                return new Int32Array(buf.slice(offsets[pos], size));
              },
              set(val: number | Int32Array) {
                setNumber(Int32Array, val, dv, offsets[pos]);
              }
            };
            break;
          case 'uint16':
            setNumber(Uint16Array, target[prop], dv, offsets[pos]);

            accessors = {
              get() {
                return new Uint16Array(buf.slice(offsets[pos], size));
              },
              set(val: number | Uint16Array) {
                setNumber(Uint16Array, val, dv, offsets[pos]);
              }
            };
            break;
          case 'uint32':
            setNumber(Uint32Array, target[prop], dv, offsets[pos]);

            accessors = {
              get() {
                return new Uint32Array(buf.slice(offsets[pos], size));
              },
              set(val: number | Uint32Array) {
                setNumber(Uint32Array, val, dv, offsets[pos]);
              }
            };
            break;
          case 'uint8':
            setNumber(Uint8Array, target[prop], dv, offsets[pos]);

            accessors = {
              get() {
                return new Uint8Array(buf.slice(offsets[pos], size));
              },
              set(val: number | Uint8Array) {
                setNumber(Uint8Array, val, dv, offsets[pos]);
              }
            };
            break;
        }

        offsets.push(size);

        if (accessors) {
          Object.defineProperties(target, {
            [prop]: accessors
          });
        }
      }

      messageQueue.push({
        action: 'create',
        origin: constructor.name,
        id: getTargetId(target),
        tb: getTripleBuffer(target)
        //tick: ?
      });
    });

    return true;
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
    dv.setUint8(offset, val as number);
  }
}
