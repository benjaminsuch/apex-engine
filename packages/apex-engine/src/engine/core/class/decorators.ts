export type ClassDecoratorFunction = (constructor: TClass) => TClass;

export function CLASS(...classFns: ClassDecoratorFunction[]) {
  return function <T extends TClass>(constructor: T, ...rest: unknown[]): T {
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

    if (IS_DEV) {
      console.log('CLASS:', constructor.name);
      console.log(Reflect.getOwnMetadata('schema', constructor));
    }

    let byteLength = 0;
    let prevSchema: PropSchema | undefined;
    let pos = 0;

    for (const key in schema) {
      const propSchema = schema[key];

      if (isPropSchema(propSchema)) {
        byteLength += propSchema.size;

        propSchema.offset = prevSchema ? prevSchema.offset + prevSchema.size : 0;
        propSchema.pos = pos++;

        prevSchema = propSchema;
      }
    }

    Reflect.defineMetadata('byteLength', byteLength, constructor);
    Reflect.defineMetadata('specifiers', classFns.map(fn => fn.name), constructor);

    for (const fn of classFns) {
      constructor = fn(constructor) as T;
    }

    return constructor;
  };
}

export function getClassSpecifiers(constructor: TClass): string {
  return Reflect.getMetadata('specifiers', constructor) as string;
}

export function hasClassSpecifier(constructor: TClass, specifier: string): boolean {
  return getClassSpecifiers(constructor).includes(specifier);
}

export function PROP(...args: Function[]) {
  return function (target: InstanceType<TClass>, prop: string | symbol): void {
    addPropToSchema(target.constructor, prop);

    for (const fn of args) {
      fn(target, prop);
    }
  };
}

export function FUNC(...args: Function[]) {
  return function (target: InstanceType<TClass>, prop: string | symbol, descriptor: PropertyDescriptor): void {
    addPropToSchema(target.constructor, prop, descriptor);

    for (const fn of args) {
      fn(target, prop, descriptor);
    }
  };
}

export interface PropSchema {
  arrayType: TypedArrayConstructor;
  isArray: boolean;
  offset: number;
  /**
   * Only relevant for type "ref".
   *
   * If `true`, the ref will be marked as a dependency and will defer
   * the proxy instantation until all dependencies are available.
   */
  required: boolean;
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

export function addPropToSchema(constructor: TClass & { schema?: Schema }, prop: string | symbol, descriptor?: PropertyDescriptor): void {
  const key = prop.toString();
  let schema = getClassSchema(constructor)!;

  if (!schema) {
    schema = {};
  }

  if (descriptor) {
    schema[key] = { type: 'function', isRPC: false, descriptor };
  } else {
    schema[key] = { type: 'uint8', size: 0, required: false, arrayType: Uint8Array, isArray: false, offset: 0, pos: 0 };
  }

  Reflect.defineMetadata('schema', schema, constructor);
}

export function getPropFromSchema(constructor: TClass, prop: string | symbol): PropSchema | FuncSchema {
  const schema = getClassSchema(constructor)!;
  return schema[prop.toString()];
}

export function setPropOnSchema(constructor: TClass, prop: string | symbol, key: keyof PropSchema | keyof FuncSchema, value: any): void {
  const schema = getClassSchema(constructor);

  if (!schema) {
    console.warn(`No schema defined`);
    return;
  }

  // @ts-ignore
  schema[prop.toString()][key] = value;
}

export function getTargetId(target: InstanceType<TClass>): undefined | number {
  return Reflect.getMetadata('id', target);
}
