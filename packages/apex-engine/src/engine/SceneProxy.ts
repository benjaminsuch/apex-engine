import { TripleBuffer } from '../platform/memory/common';

export class SceneProxy {
  public static instances = new Map<number, InstanceType<TClass>>();

  constructor(public readonly id: number, tb: TripleBuffer) {
    SceneProxy.instances.set(id, this);
  }
}
