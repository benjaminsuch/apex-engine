import type { Matrix4, Quaternion, Vector2, Vector3 } from 'three';

import { TripleBuffer } from '../../../platform/memory/common';
import { GameCreateProxyInstanceTask } from '../../tasks';
import { ApexEngine } from '../../ApexEngine';
import { type IEngineLoopTickContext } from '../../EngineLoop';
import { GameProxyManager } from '../../ProxyManager';
import { getClassSchema, getTargetId, isPropSchema } from '../class';
import { id } from './id';

export interface IProxyOrigin {
  readonly id?: number;
  readonly tripleBuffer: TripleBuffer;
  readonly byteView: Uint8Array;
  //todo: Remove
  readonly proxyMessageChannel: MessageChannel;
  getProxyMessagePort(): MessagePort;
}

export type TProxyOriginConstructor = TClass<IProxyOrigin> & { proxyClassName: string };

/**
 * @param proxyClass The class which is used to instantiate the proxy on the render-thread.
 * @returns An anonymous class that is derived from the original class.
 */
export function proxy(proxyClass: TClass) {
  return (constructor: TClass) => {
    const schema = getClassSchema(constructor);
    const bufSize = Reflect.getMetadata('byteLength', constructor);

    // We define the proxy-origin class as a metadata, to easily access it in
    // `RenderProxy`, when we construct the proxy on the render-thread.
    Reflect.defineMetadata('proxy:origin', constructor, proxyClass);

    return class extends constructor implements IProxyOrigin {
      // @ts-ignore
      public static override readonly name: string = constructor.name;

      public static readonly proxyClassName: string = proxyClass.name;

      //todo: We should only create a message channel for classes that have rpcs.
      //todo: I don't think we have to store the message channel and instead could just store the port1 and port2.
      public readonly proxyMessageChannel!: MessageChannel;

      public readonly tripleBuffer!: TripleBuffer;

      public readonly byteView!: Uint8Array;

      public readonly isProxyOrigin: boolean = true;

      constructor(...args: any[]) {
        super(...args);

        // This check is necessary, to prevent parent classes to also push into the `messageQueue`.
        //
        // Here's a more detailed explanation:
        // When a class is assigned the `proxy` specifier, the original class is exchanged with this
        // class, which inherits from the original class. Therefor, a class like `MeshComponent`,
        // would be replaced with `class extends MeshComponent`.
        //
        // This is relevant for class inheritance. The `SceneComponent` and `MeshComponent` are a good
        // example. Both classes have the `proxy` specifier assigned to them, which means that
        // `MeshComponent` becomes `class extends MeshComponent extends class extends SceneComponent`.
        // You see `MeshComponent` doesn't actually inherit from `SceneComponent`, but from the class
        // that is returned from this specifier (`class extends SceneComponent`).
        //
        // This fact leads to a problem when you instantiate `MeshComponent`. The code in this
        // constructor is not execute once, but twice (`class extends SceneComponent` executes it too).
        // As a consequence of that,we would allocate more memory and push two objects into `messageQueue`
        // (from `MessageComponent` and `class extends SceneComponent`).
        //
        // The check below ensures that we only run our constructor code, when the prototype matches the
        // original class constructor.
        if (Object.getPrototypeOf(this.constructor) !== constructor) {
          return;
        }

        id(this);

        const buf = new ArrayBuffer(bufSize);
        const dv = new DataView(buf);

        this.byteView = new Uint8Array(buf);
        this.tripleBuffer = new TripleBuffer(ApexEngine.GAME_FLAGS, bufSize);

        for (const key in schema) {
          const propSchema = schema[key];

          if (isPropSchema(propSchema)) {
            const { isArray, offset, size, type } = propSchema;
            const initialVal = this[key] as any;

            let accessors:
              | { get: (this: any) => any; set: (this: any, val: any) => void }
              | undefined;

            switch (type) {
              case 'boolean':
                dv.setUint8(offset, initialVal ? 1 : 0);

                accessors = {
                  get() {
                    return Boolean(dv.getUint8(offset));
                  },
                  set(val: number | Float32Array) {
                    dv.setUint8(offset, val ? 1 : 0);
                  }
                };
                break;
              case 'float32':
                setNumber(Float32Array, initialVal, dv, offset);

                if (isArray) {
                  Reflect.defineMetadata(
                    'value',
                    new Float32Array(buf, offset, size / Float32Array.BYTES_PER_ELEMENT),
                    this,
                    key
                  );
                }

                accessors = {
                  get() {
                    return isArray
                      ? Reflect.getOwnMetadata('value', this, key)
                      : dv.getFloat32(offset, true);
                  },
                  set(val: number | Float32Array) {
                    setNumber(Float32Array, val, dv, offset);
                  }
                };
                break;
              case 'int8':
                setNumber(Int8Array, initialVal, dv, offset);

                if (isArray) {
                  Reflect.defineMetadata('value', new Int8Array(buf, offset, size), this, key);
                }

                accessors = {
                  get() {
                    return isArray
                      ? Reflect.getOwnMetadata('value', this, key)
                      : dv.getInt8(offset);
                  },
                  set(val: number | Int8Array) {
                    setNumber(Int8Array, val, dv, offset);
                  }
                };
                break;
              case 'int16':
                setNumber(Int16Array, initialVal, dv, offset);

                if (isArray) {
                  Reflect.defineMetadata(
                    'value',
                    new Int16Array(buf, offset, size / Int16Array.BYTES_PER_ELEMENT),
                    this,
                    key
                  );
                }

                accessors = {
                  get() {
                    return isArray
                      ? Reflect.getOwnMetadata('value', this, key)
                      : dv.getInt16(offset, true);
                  },
                  set(val: number | Int16Array) {
                    setNumber(Int16Array, val, dv, offset);
                  }
                };
                break;
              case 'int32':
                setNumber(Int32Array, initialVal, dv, offset);

                if (isArray) {
                  Reflect.defineMetadata(
                    'value',
                    new Int32Array(buf, offset, size / Int32Array.BYTES_PER_ELEMENT),
                    this,
                    key
                  );
                }

                accessors = {
                  get() {
                    return isArray
                      ? Reflect.getOwnMetadata('value', this, key)
                      : dv.getInt32(offset, true);
                  },
                  set(val: number | Int32Array) {
                    setNumber(Int32Array, val, dv, offset);
                  }
                };
                break;
              case 'mat4':
                if (initialVal) {
                  const { elements } = initialVal as Matrix4;

                  for (let i = 0; i < elements.length; ++i) {
                    dv.setFloat32(offset + i * Float32Array.BYTES_PER_ELEMENT, elements[i], true);
                  }

                  setMat4(this, key, initialVal, dv, offset);
                }

                accessors = {
                  get(this) {
                    return Reflect.getMetadata('value', this, key);
                  },
                  set(this, val: Matrix4) {
                    setMat4(this, key, val, dv, offset);
                  }
                };
                break;
              case 'quat':
                if (initialVal) {
                  const { x, y, z, w } = initialVal as Quaternion;

                  dv.setFloat32(offset, x, true);
                  dv.setFloat32(offset + 4, y, true);
                  dv.setFloat32(offset + 8, z, true);
                  dv.setFloat32(offset + 12, w, true);

                  setQuat(this, key, initialVal, dv, offset);
                }

                accessors = {
                  get(this) {
                    return Reflect.getMetadata('value', this, key);
                  },
                  set(this, val: Quaternion) {
                    setQuat(this, key, val, dv, offset);
                  }
                };
                break;
              case 'ref':
                if (initialVal) {
                  //todo: `id(initialVal)` only works if we have a proxy with that id (which does not work for 3rd-party instances)
                  const refId = getTargetId(initialVal) ?? id(initialVal);
                  dv.setUint32(offset, refId, true);
                }

                Reflect.defineMetadata('value', initialVal, this, key);

                accessors = {
                  get(this) {
                    return Reflect.getMetadata('value', this, key);
                  },
                  set(this, val: InstanceType<TClass>) {
                    const refId = getTargetId(val) ?? id(val);
                    dv.setUint32(offset, refId, true);

                    Reflect.defineMetadata('value', val, this, key);
                  }
                };
                break;
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
              case 'uint16':
                setNumber(Uint16Array, initialVal, dv, offset);

                if (isArray) {
                  Reflect.defineMetadata(
                    'value',
                    new Uint16Array(buf, offset, size / Uint16Array.BYTES_PER_ELEMENT),
                    this,
                    key
                  );
                }

                accessors = {
                  get() {
                    return isArray
                      ? Reflect.getOwnMetadata('value', this, key)
                      : dv.getUint16(offset, true);
                  },
                  set(val: number | Uint16Array) {
                    setNumber(Uint16Array, val, dv, offset);
                  }
                };
                break;
              case 'uint32':
                setNumber(Uint32Array, initialVal, dv, offset);

                if (isArray) {
                  Reflect.defineMetadata(
                    'value',
                    new Uint32Array(buf, offset, size / Uint32Array.BYTES_PER_ELEMENT),
                    this,
                    key
                  );
                }

                accessors = {
                  get() {
                    return isArray
                      ? Reflect.getOwnMetadata('value', this, key)
                      : dv.getUint32(offset, true);
                  },
                  set(val: number | Uint32Array) {
                    setNumber(Uint32Array, val, dv, offset);
                  }
                };
                break;
              case 'uint8':
                setNumber(Uint8Array, initialVal, dv, offset);

                if (isArray) {
                  Reflect.defineMetadata('value', new Uint8Array(buf, offset, size), this, key);
                }

                accessors = {
                  get() {
                    return isArray
                      ? Reflect.getOwnMetadata('value', this, key)
                      : dv.getUint8(offset);
                  },
                  set(val: number | Uint8Array) {
                    setNumber(Uint8Array, val, dv, offset);
                  }
                };
                break;
              case 'vec2':
                if (initialVal) {
                  const { x, y } = initialVal as Vector2;

                  dv.setFloat32(offset, x, true);
                  dv.setFloat32(offset + 4, y, true);

                  setVec2(this, key, initialVal, dv, offset);
                }

                accessors = {
                  get(this) {
                    return Reflect.getMetadata('value', this, key);
                  },
                  set(this, val: Vector2) {
                    setVec2(this, key, val, dv, offset);
                  }
                };
                break;
              case 'vec3':
                if (initialVal) {
                  const { x, y, z } = initialVal as Vector3;

                  dv.setFloat32(offset, x, true);
                  dv.setFloat32(offset + 4, y, true);
                  dv.setFloat32(offset + 8, z, true);

                  setVec3(this, key, initialVal, dv, offset);
                }

                accessors = {
                  get(this) {
                    return Reflect.getOwnMetadata('value', this, key);
                  },
                  set(this, val: Vector3) {
                    setVec3(this, key, val, dv, offset);
                  }
                };
                break;
            }

            if (accessors) {
              Object.defineProperty(this, key, accessors);
            }
          }
        }

        GameProxyManager.getInstance().registerProxy(this);
        GameProxyManager.getInstance().queueTask(
          GameCreateProxyInstanceTask,
          this,
          args.filter(
            val => typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string'
          )
        );

        // We only create the message channel, but don't listen to any incoming messages.
        // Currently there is no reason for Proxies to send messages back, but this may change in the future.
        this.proxyMessageChannel = new MessageChannel();
      }

      public getProxyMessagePort() {
        return this.proxyMessageChannel.port2;
      }
    };
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
  const setter = setters.get(type) as string;

  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; ++i) {
      dv[setter](offset + i * type.BYTES_PER_ELEMENT, val[i], true);
    }
  } else {
    dv[setter](offset, (val ?? 0) as number, true);
  }
}

function setMat4(target: any, prop: string | symbol, val: Matrix4, dv: DataView, offset: number) {
  Reflect.defineMetadata(
    'value',
    new Proxy(val, {
      get(target: Matrix4, prop) {
        for (let i = 0; i < target.elements.length; ++i) {
          dv.setFloat32(offset + i * Float32Array.BYTES_PER_ELEMENT, target.elements[i], true);
        }

        return Reflect.get(target, prop);
      }
    }),
    target,
    prop
  );
}

function setQuat(
  target: any,
  prop: string | symbol,
  val: Quaternion,
  dv: DataView,
  offset: number
) {
  Reflect.defineMetadata(
    'value',
    new Proxy(val, {
      set(target, prop, val) {
        if (prop === 'x') dv.setFloat32(offset, val, true);
        if (prop === 'y') dv.setFloat32(offset + 4, val, true);
        if (prop === 'z') dv.setFloat32(offset + 8, val, true);
        if (prop === 'w') dv.setFloat32(offset + 12, val, true);

        return Reflect.set(target, prop, val);
      }
    }),
    target,
    prop
  );
}

function setVec2(target: any, prop: string | symbol, val: Vector2, dv: DataView, offset: number) {
  Reflect.defineMetadata(
    'value',
    new Proxy(val, {
      set(target, prop, val) {
        if (prop === 'x') dv.setFloat32(offset, val, true);
        if (prop === 'y') dv.setFloat32(offset + 4, val, true);

        return Reflect.set(target, prop, val);
      }
    }),
    target,
    prop
  );
}

function setVec3(target: any, prop: string | symbol, val: Vector3, dv: DataView, offset: number) {
  Reflect.defineMetadata(
    'value',
    new Proxy(val, {
      set(target, prop, val) {
        if (prop === 'x') dv.setFloat32(offset, val, true);
        if (prop === 'y') dv.setFloat32(offset + 4, val, true);
        if (prop === 'z') dv.setFloat32(offset + 8, val, true);

        return Reflect.set(target, prop, val);
      }
    }),
    target,
    prop
  );
}
