import { CLASS } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';

export class SkinnedMeshComponentProxy extends MeshComponentProxy {}

@CLASS(proxy(EProxyThread.Render, SkinnedMeshComponentProxy))
export class SkinnedMeshComponent extends MeshComponent {}
