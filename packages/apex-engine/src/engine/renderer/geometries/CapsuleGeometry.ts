import * as THREE from 'three';

import { CLASS } from '../../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../../core/class/specifiers/proxy';
import { type TripleBuffer } from '../../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../../EngineLoop';
import { RenderProxy } from '../RenderProxy';
import { type RenderWorker } from '../RenderWorker';

export class CapsuleGeometryProxy extends RenderProxy<THREE.CapsuleGeometry> {
  declare morphTargetsRelative: boolean;

  protected readonly object: THREE.CapsuleGeometry;

  constructor([data]: [CapsuleGeometryProxyArgs], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super([], tb, id, thread, renderer);

    this.object = THREE.CapsuleGeometry.fromJSON(data);
    this.object.name = data.name;
    this.object.uuid = data.uuid;
  }

  public override tick(context: IEngineLoopTickContext): void | Promise<void> {
    this.object.morphTargetsRelative = this.morphTargetsRelative;
  }
}

export interface CapsuleGeometryProxyArgs {
  capSegments: number;
  length: number;
  name: string;
  radialSegments: number;
  radius: number;
  uuid: string;
}

@CLASS(proxy(EProxyThread.Render, CapsuleGeometryProxy))
export class CapsuleGeometry extends THREE.CapsuleGeometry implements IProxyOrigin {
  declare readonly byteView: IProxyOrigin['byteView'];

  declare readonly tripleBuffer: IProxyOrigin['tripleBuffer'];

  declare readonly cancelDeployment: IProxyOrigin['cancelDeployment'];

  public tick(): void {}

  public getProxyArgs(): [CapsuleGeometryProxyArgs] {
    const { capSegments, length, radialSegments, radius } = this.toJSON() as any;

    return [
      {
        capSegments,
        length,
        name: this.name,
        radialSegments,
        radius,
        uuid: this.uuid,
      },
    ];
  }
}
