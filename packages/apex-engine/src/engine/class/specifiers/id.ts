let targetId = 0;

export function id(target: InstanceType<TClass>) {
  let id = Reflect.getMetadata('id', target);

  if (!id) {
    id = ++targetId;
    Reflect.defineMetadata('id', id, target);
  }

  return id;
}
