import { TripleBuffer } from '../platform/memory/common';

export abstract class SceneProxy {
  constructor(public readonly id: number, tb: TripleBuffer) {}

  public tick(time: number): void {}
}
