import { Matrix4, PerspectiveCamera, type Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, proxy } from '../core/class/specifiers/proxy';
import { float32, serialize, uint16 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { IPhysicsWorkerContext } from '../physics/PhysicsWorkerContext';
import { type RenderWorker } from './RenderWorker';
import { IRenderWorkerContext } from './RenderWorkerContext';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

const _m1 = new Matrix4();

export class CameraComponentProxy extends SceneComponentProxy<PerspectiveCamera> {
  declare aspect: number;

  declare far: number;

  declare filmGauge: number;

  declare filmOffset: number;

  declare focus: number;

  declare fov: number;

  declare near: number;

  declare zoom: number;

  protected override readonly object: PerspectiveCamera;

  constructor(
    [params, fov, aspect, near, far]: [any, number, number, number, number],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super([aspect, far, fov, near], tb, id, thread, renderer);

    const camera = this.renderer.camera as PerspectiveCamera;

    this.object = new PerspectiveCamera(fov, camera.aspect, near, far);

    if (params) {
      this.object.name = params.name;
      this.object.uuid = params.uuid || this.object.uuid;
    }

    this.renderer.camera = this.object;
  }

  public override tick(tick: IEngineLoopTickContext): void {
    super.tick(tick);

    this.object.aspect = this.aspect;
    this.object.far = this.far;
    this.object.filmGauge = this.filmGauge;
    this.object.filmOffset = this.filmOffset;
    this.object.focus = this.focus;
    this.object.fov = this.fov;
    this.object.near = this.near;
    this.object.zoom = this.zoom;
  }
}

@CLASS(proxy(EProxyThread.Render, CameraComponentProxy))
export class CameraComponent extends SceneComponent {
  @PROP(serialize(float32))
  public aspect: number = 1;

  @PROP(serialize(uint16))
  public far: number = 2000;

  @PROP(serialize(uint16))
  public filmGauge: number = 35;

  @PROP(serialize(uint16))
  public filmOffset: number = 0;

  @PROP(serialize(uint16))
  public focus: number = 10;

  @PROP(serialize(uint16))
  public fov: number = 50;

  @PROP(serialize(float32))
  public near: number = 0.1;

  @PROP(serialize(uint16))
  public zoom: number = 1;

  constructor(
    fov: CameraComponent['fov'],
    aspect: CameraComponent['aspect'],
    near: CameraComponent['near'],
    far: CameraComponent['far'],
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger,
    @IPhysicsWorkerContext physicsContext: IPhysicsWorkerContext,
    @IRenderWorkerContext renderContext: IRenderWorkerContext
  ) {
    super(instantiationService, logger, physicsContext, renderContext);

    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.setBodyType(null);

    this.componentTick.canTick = true;
  }

  public override getProxyArgs(): [{ name: string, uuid: string }, number, number, number, number] {
    return [
      {
        name: this.name,
        uuid: this.uuid,
      },
      this.fov,
      this.aspect,
      this.near,
      this.far,
    ];
  }

  protected override onLookAt(target: Vector3, position: Vector3, up: Vector3): Matrix4 {
    return _m1.lookAt(position, target, up);
  }
}
