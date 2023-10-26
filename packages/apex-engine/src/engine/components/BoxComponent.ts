import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { MeshComponent, MeshProxy } from './MeshComponent';

@CLASS(proxy(MeshProxy))
export class BoxComponent extends MeshComponent {}
