import { ApexEngine } from './ApexEngine';
import { getPropsMap } from './Prop';
import { TripleBuffer } from './TripleBuffer';

export type ClassDecoratorFunction = (constructor: TClass) => TClass;

export function CLASS(...classFns: ClassDecoratorFunction[]) {
  return function <T extends TClass>(constructor: T) {
    let Class = class EngineObject extends constructor {
      constructor(...args: any[]) {
        super(...args);

        const classProps = getPropsMap().get(constructor);

        if (!classProps) {
          return;
        }

        let error: string | undefined;

        for (const [prop, fns] of classProps) {
          for (const fn of fns) {
            error = fn(this, prop);

            if (error) {
              console.error(error);
              console.error(
                'The error above does not cause a crash and the game continues to run. ' +
                  "But it's an issue you should fix as it can cause bugs."
              );
              error = undefined;
            }
          }
        }
      }
    };

    for (const fn of classFns) {
      Class = fn(Class) as T;
    }

    return Class;
  };
}

export const proxy: ClassDecoratorFunction = constructor => {
  return class ThreadProxy extends constructor {
    #tripleBuffer: TripleBuffer;

    constructor(buffer: TripleBuffer | null = null, renderWorker: Worker, ...args: unknown[]) {
      super(...args);

      const bufferSize = getTargetBufferSize(this);

      this.#tripleBuffer = buffer ?? new TripleBuffer(ApexEngine.GAME_THREAD_FLAGS, bufferSize);

      const writeView = new DataView(this.#tripleBuffer.getWriteBuffer());
      const readView = new DataView(this.#tripleBuffer.getReadBuffer());
      const offsets = [0];

      for (const prop of Object.keys(this)) {
        const constructor = this.constructor;
        const position = Reflect.getMetadata('position', constructor, prop);
        const size = Reflect.getMetadata('size', constructor, prop);
        const type = Reflect.getMetadata('type', constructor, prop);

        if (!type || !size || position === 'undefined') continue;

        let accessors: { get: () => any; set: (val: any) => void } | undefined;

        switch (type) {
          case 'string':
            {
              const chars = new TextEncoder().encode(this[prop]);

              for (let i = 0; i < size; ++i) {
                writeView.setUint8(offsets[position] + i, chars[i]);
              }

              accessors = {
                get() {
                  const arr = new Uint8Array(new ArrayBuffer(size));
                  arr.set(new Uint8Array(readView.buffer.slice(offsets[position], size)));
                  return new TextDecoder().decode(arr.buffer).replace(/\u0000+$/, '');
                },
                set(val: string) {
                  if (isGameThread()) {
                    const chars = new TextEncoder().encode(val);

                    for (let i = 0; i < size; ++i) {
                      writeView.setUint8(offsets[position] + i, chars[i] ?? 0x0);
                    }
                  } else {
                    console.warn(`Only the Game-Thread can set a value for this prop (${prop}).`);
                  }
                }
              };
            }
            break;
          case 'uint16':
            writeView.setUint16(offsets[position], this[prop], false);

            accessors = {
              get() {
                return readView.getUint16(offsets[position], false);
              },
              set(val: number) {
                if (isGameThread()) {
                  writeView.setUint16(offsets[position], val, false);
                } else {
                  console.warn(`Only the Game-Thread can set a value for this prop (${prop}).`);
                }
              }
            };

            break;
          case 'uint8':
            writeView.setUint8(offsets[position], this[prop]);

            accessors = {
              get() {
                return readView.getUint8(offsets[position]);
              },
              set(val: number) {
                if (isGameThread()) {
                  writeView.setUint8(offsets[position], val);
                } else {
                  console.warn(`Only the Game-Thread can set a value for this prop (${prop}).`);
                }
              }
            };

            break;
          case 'int8':
            writeView.setInt8(offsets[position], this[prop]);

            accessors = {
              get() {
                return readView.getInt8(offsets[position]);
              },
              set(val: number) {
                if (isGameThread()) {
                  writeView.setInt8(offsets[position], val);
                } else {
                  console.warn(`Only the Game-Thread can set a value for this prop (${prop}).`);
                }
              }
            };

            break;
          case 'boolean':
            writeView.setUint8(offsets[position], this[prop]);

            accessors = {
              get() {
                return Boolean(readView.getUint8(offsets[position]));
              },
              set(val: boolean) {
                if (isGameThread()) {
                  writeView.setUint8(offsets[position], val ? 1 : 0);
                } else {
                  console.warn(`Only the Game-Thread can set a value for this prop (${prop}).`);
                }
              }
            };

            break;
        }

        offsets.push(last(offsets) + size);

        if (accessors) {
          Object.defineProperties(this, { [prop]: accessors });
        }
      }

      if (isGameThread()) {
        renderWorker.postMessage({
          type: 'instance',
          buffers: this.#tripleBuffer.buffers,
          byteLength: this.#tripleBuffer.byteLength
        });
      }
    }
  };
};

function isGameThread() {
  return typeof window !== 'undefined';
}

function getTargetBufferSize(target: InstanceType<TClass>) {
  let size = 0;

  for (const key of Object.keys(target)) {
    size += Reflect.getMetadata('size', target.constructor, key) ?? 0;
  }

  return size;
}

function last<T = unknown>(arr: T[]): T {
  return arr.slice().pop() as T;
}
