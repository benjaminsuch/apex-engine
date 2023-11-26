export type ClassDecoratorFunction = (constructor: TClass) => TClass;

export function CLASS(...classFns: ClassDecoratorFunction[]) {
  return function <T extends TClass>(constructor: T, ...rest: unknown[]) {
    console.log('CLASS:', constructor.name, rest);

    if (!getClassSchema(constructor)) {
      Reflect.defineMetadata('schema', {}, constructor);
    }

    let schema = getClassSchema(constructor)!;
    let currentTarget = constructor;

    while (currentTarget) {
      schema = { ...Reflect.getOwnMetadata('schema', currentTarget), ...schema };
      currentTarget = Object.getPrototypeOf(currentTarget);
    }

    Reflect.defineMetadata('schema', schema, constructor);
    console.log('schema', Reflect.getOwnMetadata('schema', constructor));

    let byteLength = 0;

    for (const key in schema) {
      byteLength += schema[key].size;
    }

    Reflect.defineMetadata('byteLength', byteLength, constructor);

    for (const fn of classFns) {
      constructor = fn(constructor) as T;
    }

    return constructor;
  };
}

export function PROP(...args: Function[]) {
  return function (target: InstanceType<TClass>, prop: string | symbol) {
    addPropToSchema(target.constructor, prop);

    for (const fn of args) {
      fn(target, prop);
    }

    console.log('PROP:', prop);
  };
}

export interface Schema {
  [key: string]: {
    arrayType: TypedArray;
    isArray: boolean;
    offset: number;
    pos: number;
    size: number;
    type: string;
  };
}

export function getClassSchema(constructor: TClass): Schema | undefined {
  return Reflect.getOwnMetadata('schema', constructor);
}

export function addPropToSchema(constructor: TClass & { schema?: Schema }, prop: string | symbol) {
  const key = prop.toString();
  let schema = getClassSchema(constructor);

  if (!schema) {
    schema = {};
  }

  const keys = Object.keys(schema);
  const pos = keys.length;
  const prevKey = keys.find(val => schema?.[val].pos === pos - 1);
  const offset = prevKey ? schema[prevKey].offset + schema[prevKey].size : 0;

  schema[key] = { arrayType: Uint8Array, isArray: false, offset, pos, size: 0, type: 'uint8' };

  Reflect.defineMetadata('schema', schema, constructor);
}

export function getPropFromSchema(constructor: TClass, prop: string | symbol) {
  const schema = getClassSchema(constructor)!;
  return schema[prop.toString()];
}

export function setPropOnSchema(
  constructor: TClass,
  prop: string | symbol,
  key: string,
  value: any
) {
  const schema = getClassSchema(constructor);

  if (!schema) {
    console.warn(`No schema defined`);
    return;
  }

  schema[prop.toString()][key] = value;
}

export function getTargetId(target: InstanceType<TClass>): undefined | number {
  return Reflect.getMetadata('id', target);
}
