import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { RenderProxy } from './RenderProxy';
import { type SceneComponent } from './SceneComponent';

export class SkeletonProxy extends RenderProxy {}

@CLASS(proxy(EProxyThread.Render, SkeletonProxy))
export class Skeleton {
  constructor(public readonly bones: SceneComponent['uuid'][]) {}
}
