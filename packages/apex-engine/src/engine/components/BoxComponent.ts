import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { MeshComponent } from './MeshComponent';

@CLASS(proxy())
export class BoxComponent extends MeshComponent {}
