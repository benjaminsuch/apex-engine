import { Matrix4, Quaternion, Vector2, Vector3 } from 'three';

import { TripleBuffer } from '../../../platform/memory/common';
import { ApexEngine } from '../../ApexEngine';
import { getClassSchema, getTargetId } from '../class';
import { id } from './id';

export const messageQueue: any[] = [];

export function proxy(proxyClass: TClass) {
  return (constructor: TClass) => {
    const schema = getClassSchema(constructor);
    const bufSize = Reflect.getMetadata('byteLength', constructor);

    // We define the proxy-origin class as a metadata, to easily access it in
    // `SceneProxy`, when we construct the proxy on the render-thread.
    Reflect.defineMetadata('proxy:origin', constructor, proxyClass);

    return class extends constructor {
      public static override readonly name: string = constructor.name;

      public tripleBuffer?: TripleBuffer;

      public byteView?: Uint8Array;

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
        // constructor is not exectute once, but twice (`class extends SceneComponent` executes it too).
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
          const { offset, size, type } = schema[key];
          const initialVal = this[key] as any;

          let accessors:
            | { get: (this: any) => any; set: (this: any, val: any) => void }
            | undefined;

          switch (type) {
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
                  return Reflect.getMetadata('value', this, key);
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

        messageQueue.push({
          type: 'proxy',
          constructor: proxyClass.name,
          id: getTargetId(this),
          tb: this.tripleBuffer
        });
      }

      public tick() {
        super.tick();

        if (this.tripleBuffer && this.byteView) {
          this.tripleBuffer.copyToWriteBuffer(this.byteView);
        }
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
  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; ++i) {
      dv[setters.get(type) as string](offset + i * type.BYTES_PER_ELEMENT, val[i], true);
    }
  } else {
    dv.setUint8(offset, (val ?? 0) as number);
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
