import { ApexEngine } from '../../ApexEngine';
import { SceneProxy } from '../../SceneProxy';
import { TripleBuffer } from '../../TripleBuffer';
import {
  getClassSchema,
  getClassSpecifiers,
  getTargetId,
  getTripleBuffer,
  setTripleBuffer
} from '../class';

export const messageQueue: any[] = [];

export function proxy(proxyClass: TClass) {
  return (constructor: TClass) => {
    const bufferSize = Reflect.getMetadata('byteLength', constructor);
    console.log('bufferSize', bufferSize);

    if (!SceneProxy.origins.has(proxyClass)) {
      SceneProxy.origins.set(proxyClass, constructor);
    }

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

      for (const [prop, { type, isArray, pos, size }] of Object.entries(schema)) {
        let accessors: { get: () => any; set: (val: any) => void } | undefined;

        switch (type) {
          case 'string':
            const chars = new TextEncoder().encode(target[prop]);

            for (let i = 0; i < size; ++i) {
              dv.setUint8(offsets[pos] + i, chars[i]);
            }

            accessors = {
              get() {
                const arr = new Uint8Array(new ArrayBuffer(size));
                arr.set(new Uint8Array(dv.buffer.slice(offsets[pos], size)));

                return new TextDecoder().decode(arr.buffer).replace(/\u0000+$/, '');
              },
              set(val: string) {
                const chars = new TextEncoder().encode(val);

                for (let i = 0; i < size; ++i) {
                  dv.setUint8(offsets[pos] + i, chars[i] ?? 0x0);
                }
              }
            };
            break;
          case 'float32':
            if (isArray) {
              for (let i = 0; i < target[prop].length; ++i) {
                dv.setFloat32(offsets[pos] + i * Float32Array.BYTES_PER_ELEMENT, target[prop][i]);
              }
            } else {
              dv.setFloat32(offsets[pos], target[prop]);
            }

            accessors = {
              get() {
                return new Float32Array(buf.slice(offsets[pos], size));
              },
              set(val: number | Float32Array) {
                if (val instanceof Float32Array) {
                  for (let i = 0; i < val.length; ++i) {
                    dv.setUint8(offsets[pos] + i * Float32Array.BYTES_PER_ELEMENT, target[prop][i]);
                  }
                } else {
                  dv.setUint8(offsets[pos], val);
                }
              }
            };
            break;
          case 'uint8':
            if (isArray) {
              for (let i = 0; i < target[prop].length; ++i) {
                dv.setUint8(offsets[pos] + i, target[prop][i]);
              }
            } else {
              dv.setUint8(offsets[pos], target[prop]);
            }

            accessors = {
              get() {
                return new Uint8Array(buf.slice(offsets[pos], size));
              },
              set(val: number | Uint8Array) {
                if (val instanceof Uint8Array) {
                  for (let i = 0; i < val.length; ++i) {
                    dv.setUint8(offsets[pos] + i, target[prop][i]);
                  }
                } else {
                  dv.setUint8(offsets[pos], val);
                }
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
        type: target.constructor.name,
        id: getTargetId(target),
        tb: getTripleBuffer(target)
      });
    });

    return true;
  };
}
