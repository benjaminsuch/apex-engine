import { CLASS, PROP } from './class';
import { proxy } from './class/specifiers/proxy';
import { serialize, uint16 } from './class/specifiers/serialize';
import { RenderProxy } from './renderer';

export class BoxGeometryProxy extends RenderProxy {
  declare depth: number;

  declare depthSegments: number;

  declare height: number;

  declare heightSegments: number;

  declare width: number;

  declare widthSegments: number;
}

@CLASS(proxy(BoxGeometryProxy))
export class BoxGeometry {
  @PROP(serialize(uint16))
  public width: number;

  @PROP(serialize(uint16))
  public height: number;

  @PROP(serialize(uint16))
  public depth: number;

  @PROP(serialize(uint16))
  public widthSegments: number;

  @PROP(serialize(uint16))
  public heightSegments: number;

  @PROP(serialize(uint16))
  public depthSegments: number;

  constructor(
    width: number = 1,
    height: number = 1,
    depth: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1,
    depthSegments: number = 1
  ) {
    this.depth = depth;
    this.height = height;
    this.width = width;
    this.depthSegments = depthSegments;
    this.heightSegments = heightSegments;
    this.widthSegments = widthSegments;
  }
}
