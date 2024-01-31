let targetId = 0;

export function id(target: InstanceType<TClass>, val?: number): number {
  if (val) {
    Reflect.defineMetadata('id', val, target);
    return val;
  }

  let id = Reflect.getOwnMetadata('id', target);

  if (!id) {
    id = ++targetId;
    Reflect.defineMetadata('id', id, target);
  }

  return id;
}
