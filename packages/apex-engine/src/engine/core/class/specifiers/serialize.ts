import { setPropOnSchema } from '../decorators';

type SerializerFunction = (constructor: TClass, prop: string | symbol) => void;

function setPropSize(constructor: TClass, prop: string | symbol, size: number): void {
  setPropOnSchema(constructor, prop, 'size', size);
  Reflect.defineMetadata('size', size, constructor, prop);
}

function setPropType(
  constructor: TClass,
  prop: string | symbol,
  type: string,
  arrayType: TypedArrayConstructor,
  isArray: boolean = false
): void {
  setPropOnSchema(constructor, prop, 'arrayType', arrayType);
  setPropOnSchema(constructor, prop, 'type', type);
  setPropOnSchema(constructor, prop, 'isArray', isArray);
  Reflect.defineMetadata('type', type, constructor, prop);
}

function createSerializer(
  type: string,
  arrayType: TypedArrayConstructor,
  size: number,
  isArray: boolean = false
): SerializerFunction {
  return (constructor, prop) => {
    setPropType(constructor, prop, type, arrayType, isArray);
    setPropSize(constructor, prop, size);
  };
}

function getSize(size: number | [number]): number {
  return Array.isArray(size) ? size[0] : size;
}

export function string(size: number): SerializerFunction {
  return createSerializer('string', Uint8Array, size);
}

export function float32(size: number | [number]): SerializerFunction {
  return createSerializer(
    'float32',
    Float32Array,
    getSize(size) * Float32Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function int8(size: number | [number]): SerializerFunction {
  return createSerializer('int8', Int8Array, getSize(size), Array.isArray(size));
}

export function uint8(size: number | [number]): SerializerFunction {
  return createSerializer('uint8', Uint8Array, getSize(size), Array.isArray(size));
}

export function int16(size: number | [number]): SerializerFunction {
  return createSerializer(
    'int16',
    Int16Array,
    getSize(size) * Int16Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function uint16(size: number | [number]): SerializerFunction {
  return createSerializer(
    'uint16',
    Uint16Array,
    getSize(size) * Uint16Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function int32(size: number | [number]): SerializerFunction {
  return createSerializer(
    'int32',
    Int32Array,
    getSize(size) * Int32Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function uint32(size: number | [number]): SerializerFunction {
  return createSerializer(
    'uint32',
    Uint32Array,
    getSize(size) * Uint32Array.BYTES_PER_ELEMENT,
    Array.isArray(size)
  );
}

export function boolean(): SerializerFunction {
  return createSerializer('boolean', Uint8Array, 1);
}

export function mat4(): SerializerFunction {
  return createSerializer('mat4', Float32Array, 16 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function quat(): SerializerFunction {
  return createSerializer('quat', Float32Array, 4 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function vec2(): SerializerFunction {
  return createSerializer('vec2', Float32Array, 2 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function vec3(): SerializerFunction {
  return createSerializer('vec3', Float32Array, 3 * Float32Array.BYTES_PER_ELEMENT, true);
}

export function serialize(fn: Function, size: number | [number] = 1): SerializerFunction {
  return (target: InstanceType<TClass>, prop: string | symbol) => {
    fn(size)(target.constructor, prop);
  };
}

export function ref(): SerializerFunction {
  return createSerializer('ref', Uint32Array, Uint32Array.BYTES_PER_ELEMENT);
}
