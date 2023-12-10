import { TripleBuffer } from '../platform/memory/common';
import { CLASS } from './class';
import { proxy } from './class/specifiers/proxy';
import { RenderProxy, Renderer } from './renderer';
import { BufferGeometry, BufferGeometryProxy } from './BufferGeometry';

export class BoxGeometryProxy extends BufferGeometryProxy {
  public width: number = 1;

  public height: number = 1;

  public depth: number = 1;

  public widthSegments: number = 1;

  public heightSegments: number = 1;

  public depthSegments: number = 1;

  constructor(
    args: number[],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly messagePort: MessagePort | null = null,
    protected override readonly renderer: Renderer
  ) {
    super(args, tb, id, messagePort, renderer);

    this.width = args[0];
    this.height = args[1];
    this.depth = args[2];
    this.widthSegments = args[3];
    this.heightSegments = args[4];
    this.depthSegments = args[5];
  }
}

@CLASS(proxy(BoxGeometryProxy))
export class BoxGeometry extends BufferGeometry {
  constructor(
    width: number = 1,
    height: number = 1,
    depth: number = 1,
    widthSegments: number = 1,
    heightSegments: number = 1,
    depthSegments: number = 1
  ) {
    super();
  }
}
