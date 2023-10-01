import { TripleBuffer } from '../platform/memory/common/TripleBuffer';

export type ClassDecoratorFunction = (constructor: TClass) => TClass;

export function CLASS(...classFns: ClassDecoratorFunction[]) {
  return function <T extends TClass>(constructor: T) {
    Reflect.defineMetadata('class:specifiers', new Map<string, Function>(), constructor);

    for (const fn of classFns) {
      if (!fn(constructor)) {
        console.error(`An error occured during one of the class specifiers (${fn.name}).`);
      }
    }

    return constructor;
  };
}

export const proxies: InstanceType<TClass>[] = [];

export const proxiesToSend: InstanceType<TClass>[] = [];

export function proxy(constructor: TClass) {
  const isProxy = Reflect.getMetadata('proxy', constructor);

  if (!isProxy) {
    Reflect.defineMetadata('proxy', true, constructor);
  }

  const specifiers = Reflect.getMetadata('class:specifiers', constructor);
  const props: string[] = Reflect.getMetadata('class:props', constructor);

  let bufferSize = 0;

  for (const prop of props) {
    bufferSize += Reflect.getMetadata('size', constructor, prop) ?? 0;
  }

  specifiers.set('proxy', (target: InstanceType<TClass>, flags: Uint8Array) => {
    let tripleBuffer = Reflect.getMetadata('instance:buffer', target);

    if (!tripleBuffer) {
      tripleBuffer = new TripleBuffer(flags, bufferSize);
      Reflect.defineMetadata('instance:buffer', tripleBuffer, target);
    }

    const writeView = new DataView(tripleBuffer.getWriteBuffer());
    const readView = new DataView(tripleBuffer.getReadBuffer());
    const offsets = [0];

    for (const prop of props) {
      const position = props.indexOf(prop);
      const size = Reflect.getMetadata('size', constructor, prop);
      const type = Reflect.getMetadata('type', constructor, prop);

      if (!type || !size) continue;

      let accessors: { get: () => any; set: (val: any) => void } | undefined;

      switch (type) {
        case 'string':
          {
            const chars = new TextEncoder().encode(target[prop]);

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
          writeView.setUint16(offsets[position], target[prop], false);

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
          writeView.setUint8(offsets[position], target[prop]);

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
          writeView.setInt8(offsets[position], target[prop]);

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
          writeView.setUint8(offsets[position], target[prop]);

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
        Object.defineProperties(target, { [prop]: accessors });
      }
    }

    if (proxies.indexOf(target) === -1) {
      proxies.push(target);
    }

    if (proxiesToSend.indexOf(target) === -1) {
      proxiesToSend.push(target);
    }
  });

  return true;
}

function isGameThread() {
  return typeof window !== 'undefined';
}

function last<T = unknown>(arr: T[]): T {
  return arr.slice().pop() as T;
}
