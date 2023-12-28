import { CLASS } from '../core/class/decorators';
import { proxy } from '../core/class/specifiers/proxy';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class MeshComponentProxy extends SceneComponentProxy {}

@CLASS(proxy(MeshComponentProxy))
export class MeshComponent extends SceneComponent {}
