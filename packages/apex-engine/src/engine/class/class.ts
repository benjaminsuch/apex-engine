export type ClassDecoratorFunction = (constructor: TClass) => TClass;

export function CLASS(...classFns: ClassDecoratorFunction[]) {
  return function <T extends TClass>(constructor: T, ...rest: unknown[]) {
    console.log('CLASS:', constructor.name, rest);

    if (!getClassSchema(constructor)) {
      Reflect.defineMetadata('schema', {}, constructor);
    }

    let schema = getClassSchema(constructor)!;
    let currentTarget = constructor;

    // By traversing the prototype chain, we make sure, that we only store the schema
    // for the respective class and not it's derived classes. Derived classes will still
    // extend their schema with that from the parent class though.
    while (currentTarget) {
      schema = { ...Reflect.getOwnMetadata('schema', currentTarget), ...schema };
      currentTarget = Object.getPrototypeOf(currentTarget);
    }

    Reflect.defineMetadata('schema', schema, constructor);
    console.log('schema', Reflect.getOwnMetadata('schema', constructor));

    let byteLength = 0;

    for (const key in schema) {
      const propSchema = schema[key];

      if (isPropSchema(propSchema)) {
        byteLength += propSchema.size;
      }
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

export function FUNC(...args: Function[]) {
  return function (
    target: InstanceType<TClass>,
    prop: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    addPropToSchema(target.constructor, prop, descriptor);

    for (const fn of args) {
      fn(target, prop, descriptor);
    }

    console.log('FUNC:', prop);
  };
}

export interface PropSchema {
  arrayType: TypedArray;
  isArray: boolean;
  offset: number;
  pos: number;
  size: number;
  type: string;
}

export interface FuncSchema {
  type: 'function';
  isRPC: boolean;
  descriptor: PropertyDescriptor;
}

export interface Schema {
  [key: string]: PropSchema | FuncSchema;
}

export function getClassSchema(constructor: TClass): Schema | undefined {
  return Reflect.getOwnMetadata('schema', constructor);
}

export function isPropSchema(schema: PropSchema | FuncSchema): schema is PropSchema {
  return schema.type !== 'function';
}

export function isFuncSchema(schema: PropSchema | FuncSchema): schema is FuncSchema {
  return schema.type === 'function';
}

export function addPropToSchema(
  constructor: TClass & { schema?: Schema },
  prop: string | symbol,
  descriptor?: PropertyDescriptor
) {
  const key = prop.toString();
  let schema = getClassSchema(constructor)!;

  if (!schema) {
    schema = {};
  }

  if (descriptor) {
    schema[key] = { type: 'function', isRPC: false, descriptor };
  } else {
    const keys = Object.keys(schema).filter(val => schema[val].type !== 'function');
    const pos = keys.length;
    const prevKey = keys.find(val => (schema[val] as PropSchema).pos === pos - 1);
    const prevSchema = prevKey ? (schema[prevKey] as PropSchema) : null;
    const offset = prevSchema ? prevSchema.offset + prevSchema.size : 0;

    schema[key] = { type: 'uint8', size: 0, arrayType: Uint8Array, isArray: false, offset, pos };
  }

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
