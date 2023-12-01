import { CLASS } from './class';
import { proxy } from './class/specifiers/proxy';
import { RenderProxy } from './RenderProxy';

export class BoxGeometryProxy extends RenderProxy {}

@CLASS(proxy(BoxGeometryProxy))
export class BoxGeometry {
  constructor(
    public width: number = 1,
    public height: number = 1,
    public depth: number = 1,
    public widthSegments: number = 1,
    public heightSegments: number = 1,
    public depthSegments: number = 1
  ) {}
}
