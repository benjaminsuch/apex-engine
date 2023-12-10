import { CLASS } from './class';
import { proxy } from './class/specifiers/proxy';
import { RenderProxy } from './renderer';

export class BufferGeometryProxy extends RenderProxy {}

@CLASS(proxy(BufferGeometryProxy))
export class BufferGeometry {}
