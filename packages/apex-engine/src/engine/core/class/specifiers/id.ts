let targetId = 0;

export function id(target: InstanceType<TClass>): number {
  let id = Reflect.getOwnMetadata('id', target);

  if (!id) {
    id = ++targetId;
    Reflect.defineMetadata('id', id, target);
  }

  return id;
}
