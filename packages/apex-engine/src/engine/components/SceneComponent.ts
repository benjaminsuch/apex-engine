import { IConsoleLogger } from '../../platform/logging/common';
import { type TRenderSceneProxyInitMessage } from '../../platform/renderer/common';
import { SceneProxyConstructorData } from '../SceneProxy';
import { Euler, Matrix4, Quaternion, Vector3 } from '../math';
import { ActorComponent } from './ActorComponent';

export type SceneObjectType = 'Object3D' | 'PerspectiveCamera';

export class SceneComponent extends ActorComponent {
  public readonly position: Vector3 = new Vector3();

  public readonly scale: Vector3 = new Vector3();

  public readonly rotation: Euler = new Euler();

  public readonly quaternion: Quaternion = new Quaternion();

  public readonly matrix: Matrix4 = new Matrix4();

  public readonly matrixWorld: Matrix4 = new Matrix4();

  public visible: boolean = true;

  private readonly children: Set<SceneComponent> = new Set();

  public readonly objectType: SceneObjectType = 'Object3D';

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {
    super();

    this.scale.set(1, 1, 1);
  }

  public override init(): void {
    this.logger.debug(this.constructor.name, 'init', this.uuid);

    this.getOwner().renderer.send<TRenderSceneProxyInitMessage>({
      type: 'init-scene-proxy',
      component: this.toJSON()
    });

    super.init();
  }

  public attachToParent(parent: SceneComponent): void {
    parent.children.add(this);
  }

  public toJSON(): SceneProxyConstructorData {
    return {
      uuid: this.uuid,
      objectType: this.objectType,
      position: this.position.toJSON(),
      scale: this.scale.toJSON(),
      rotation: this.rotation.toJSON(),
      quaternion: this.quaternion.toJSON(),
      matrix: this.matrix.toJSON(),
      matrixWorld: this.matrixWorld.toJSON(),
      visible: this.visible,
      children: [...this.children].map(child => child.toJSON())
    };
  }
}
