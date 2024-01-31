import '../../launch/bootstrap';

import * as RAPIER from '@dimforge/rapier3d-compat';
import * as Comlink from 'comlink';

import { InstantiationService } from '../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../platform/di/common/ServiceCollection';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { getTargetId } from '../core/class/decorators';
import { EProxyThread, type IProxyConstructionData, type IProxyOrigin } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { Flags } from '../Flags';
import { type ProxyInstance } from '../ProxyInstance';
import { ProxyManager } from '../ProxyManager';
import { ETickGroup, TickManager } from '../TickManager';
import { Collider } from './Collider';
import { KinematicControllerProxy } from './KinematicController';
import { PhysicsInfo } from './PhysicsInfo';
import { RigidBody } from './RigidBody';

export interface ICreatedProxyData {
  id: number;
  tb: IProxyOrigin['tripleBuffer'];
}

export interface IColliderBallConstructorArgs {
  radius: number;
}

export interface IColliderHalfSpaceConstructorArgs {
  normal: RAPIER.Vector;
}

export interface IColliderCuboidConstructorArgs {
  hx: number;
  hy: number;
  hz: number;
}

export interface IColliderRoundCuboidConstructorArgs {
  hx: number;
  hy: number;
  hz: number;
  borderRadius: number;
}

export interface IColliderCapsuleConstructorArgs {
  halfHeight: number;
  radius: number;
}

export interface IColliderSegmentConstructorArgs {
  a: RAPIER.Vector;
  b: RAPIER.Vector;
}

export interface IColliderTriangleConstructorArgs {
  a: RAPIER.Vector;
  b: RAPIER.Vector;
  c: RAPIER.Vector;
}

export interface IColliderRoundTriangleConstructorArgs {
  a: RAPIER.Vector;
  b: RAPIER.Vector;
  c: RAPIER.Vector;
  borderRadius: number;
}

export interface IColliderPolylineConstructorArgs {
  vertices: Float32Array;
  indices?: Uint32Array;
}

export interface IColliderTriMeshConstructorArgs {
  vertices: Float32Array;
  indices: Uint32Array;
}

export interface IColliderConvexPolyhedronConstructorArgs {
  vertices: Float32Array;
  indices?: Uint32Array;
}

export interface IColliderRoundConvexPolyhedronConstructorArgs {
  vertices: Float32Array;
  indices?: Uint32Array;
  borderRadius: number;
}

export interface IColliderHeightFieldConstructorArgs {
  nrows: number;
  ncols: number;
  heights: Float32Array;
  scale: RAPIER.Vector;
}

export interface IColliderCylinderConstructorArgs {
  halfHeight: number;
  radius: number;
}

export interface IColliderRoundCylinderConstructorArgs {
  halfHeight: number;
  radius: number;
  borderRadius: number;
}

export interface IColliderConeConstructorArgs {
  halfHeight: number;
  radius: number;
}

export interface IColliderRoundConeConstructorArgs {
  halfHeight: number;
  radius: number;
  borderRadius: number;
}

type GetColliderArgsByShape<T> = T extends RAPIER.ShapeType.Ball
  ? IColliderBallConstructorArgs
  : T extends RAPIER.ShapeType.Capsule
    ? IColliderCapsuleConstructorArgs
    : T extends RAPIER.ShapeType.Cone
      ? IColliderConeConstructorArgs
      : T extends RAPIER.ShapeType.ConvexPolyhedron
        ? IColliderConvexPolyhedronConstructorArgs
        : T extends RAPIER.ShapeType.Cuboid
          ? IColliderCuboidConstructorArgs
          : T extends RAPIER.ShapeType.Cylinder
            ? IColliderCylinderConstructorArgs
            : T extends RAPIER.ShapeType.HeightField
              ? IColliderHeightFieldConstructorArgs
              : T extends RAPIER.ShapeType.Polyline
                ? IColliderPolylineConstructorArgs
                : T extends RAPIER.ShapeType.RoundCone
                  ? IColliderRoundConeConstructorArgs
                  : T extends RAPIER.ShapeType.RoundConvexPolyhedron
                    ? IColliderRoundConvexPolyhedronConstructorArgs
                    : T extends RAPIER.ShapeType.RoundCuboid
                      ? IColliderRoundCuboidConstructorArgs
                      : T extends RAPIER.ShapeType.RoundCylinder
                        ? IColliderRoundCylinderConstructorArgs
                        : T extends RAPIER.ShapeType.RoundTriangle
                          ? IColliderRoundTriangleConstructorArgs
                          : T extends RAPIER.ShapeType.Segment
                            ? IColliderSegmentConstructorArgs
                            : T extends RAPIER.ShapeType.TriMesh
                              ? IColliderTriMeshConstructorArgs
                              : T extends RAPIER.ShapeType.Triangle
                                ? IColliderTriangleConstructorArgs
                                : never;

type GetColliderDescConstructorByShape<T> = T extends RAPIER.ShapeType.Ball
  ? typeof RAPIER.ColliderDesc.ball
  : T extends RAPIER.ShapeType.Capsule
    ? typeof RAPIER.ColliderDesc.capsule
    : T extends RAPIER.ShapeType.Cone
      ? typeof RAPIER.ColliderDesc.cone
      : T extends RAPIER.ShapeType.ConvexPolyhedron
        ? typeof RAPIER.ColliderDesc.convexHull
        : T extends RAPIER.ShapeType.Cuboid
          ? typeof RAPIER.ColliderDesc.cuboid
          : T extends RAPIER.ShapeType.Cylinder
            ? typeof RAPIER.ColliderDesc.cylinder
            : T extends RAPIER.ShapeType.HeightField
              ? typeof RAPIER.ColliderDesc.heightfield
              : T extends RAPIER.ShapeType.Polyline
                ? typeof RAPIER.ColliderDesc.polyline
                : T extends RAPIER.ShapeType.RoundCone
                  ? typeof RAPIER.ColliderDesc.roundCone
                  : T extends RAPIER.ShapeType.RoundConvexPolyhedron
                    ? typeof RAPIER.ColliderDesc.roundConvexHull
                    : T extends RAPIER.ShapeType.RoundCuboid
                      ? typeof RAPIER.ColliderDesc.roundCuboid
                      : T extends RAPIER.ShapeType.RoundCylinder
                        ? typeof RAPIER.ColliderDesc.roundCylinder
                        : T extends RAPIER.ShapeType.RoundTriangle
                          ? typeof RAPIER.ColliderDesc.roundTriangle
                          : T extends RAPIER.ShapeType.Segment
                            ? typeof RAPIER.ColliderDesc.segment
                            : T extends RAPIER.ShapeType.TriMesh
                              ? typeof RAPIER.ColliderDesc.trimesh
                              : T extends RAPIER.ShapeType.Triangle
                                ? typeof RAPIER.ColliderDesc.triangle
                                : never;

type ColliderDescConstructor = typeof RAPIER.ColliderDesc.ball
  | typeof RAPIER.ColliderDesc.capsule
  | typeof RAPIER.ColliderDesc.cone
  | typeof RAPIER.ColliderDesc.convexHull
  | typeof RAPIER.ColliderDesc.cuboid
  | typeof RAPIER.ColliderDesc.cylinder
  | typeof RAPIER.ColliderDesc.heightfield
  | typeof RAPIER.ColliderDesc.polyline
  | typeof RAPIER.ColliderDesc.roundCone
  | typeof RAPIER.ColliderDesc.roundConvexHull
  | typeof RAPIER.ColliderDesc.roundCuboid
  | typeof RAPIER.ColliderDesc.roundCylinder
  | typeof RAPIER.ColliderDesc.roundTriangle
  | typeof RAPIER.ColliderDesc.segment
  | typeof RAPIER.ColliderDesc.trimesh
  | typeof RAPIER.ColliderDesc.triangle;

export type RegisterColliderArgs<T> = { rigidBodyId: ProxyInstance['id'] } & GetColliderArgsByShape<T>;

export interface IInternalPhysicsWorkerContext {
  readonly world: RAPIER.World;
  readonly info: PhysicsInfo;
  readonly renderPort: MessagePort;
  readonly proxyManager: ProxyManager<IProxyOrigin>;
  readonly tickManager: TickManager;
  /**
   * Creates proxies sent from the game-thread.
   *
   * @param proxies
   */
  createProxies(proxies: IProxyConstructionData[]): void;
  step(tick: IEngineLoopTickContext, tasks: any[]): void;
  registerCollider<T extends RAPIER.ShapeType>(type: T, args: RegisterColliderArgs<T>): ICreatedProxyData;
  registerRigidBody(type: RAPIER.RigidBodyType): ICreatedProxyData;
}

const proxyConstructors = { KinematicControllerProxy };
const services = new ServiceCollection();
const logger = new ConsoleLogger();

services.set(IConsoleLogger, logger);

const instantiationService = new InstantiationService(services);

self.addEventListener('message', onInit);

const defaultTasks = [
  {
    proxy: 1,
    method: 'setApplyImpulsesToDynamicBodies',
    params: [true],
  },
  {
    proxy: 1,
    method: 'enableAutostep',
    params: [0.7, 0.3, true],
  },
  {
    proxy: 1,
    method: 'enableSnapToGround',
    params: [0.7],
  },
];

function onInit(event: MessageEvent): void {
  if (typeof event.data !== 'object') {
    return;
  }

  if (event.data.type === 'init') {
    self.removeEventListener('message', onInit);

    const { flags, renderPort } = event.data;

    Flags.PHYSICS_FLAGS = flags[0];

    RAPIER.init().then(() => {
      const context: IInternalPhysicsWorkerContext = {
        world: new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 }),
        info: instantiationService.createInstance(PhysicsInfo, Flags.PHYSICS_FLAGS, undefined),
        renderPort,
        tickManager: instantiationService.createInstance(TickManager),
        proxyManager: instantiationService.createInstance(ProxyManager, EProxyThread.Physics, proxyConstructors),
        createProxies(proxies) {
          logger.debug('Creating proxies:', proxies);

          for (let i = 0; i < proxies.length; ++i) {
            const { constructor, id, tb, args, thread } = proxies[i];
            const ProxyConstructor = this.proxyManager.getProxyConstructor(constructor);

            if (!ProxyConstructor) {
              logger.warn(`Constructor (${constructor}) not found for proxy "${id}".`);
              return;
            }

            const proxy = instantiationService.createInstance(
              ProxyConstructor,
              args,
              new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
              id,
              thread,
              this,
            );
            console.log('proxy', proxy);
            this.proxyManager.registerProxy(proxy);
          }
        },
        registerRigidBody(type) {
          const desc = createRigidBodyDesc(type).setTranslation(0, 0, 0);
          const proxyOrigin = instantiationService.createInstance(RigidBody, this.world.createRigidBody(desc)) as RigidBody & IProxyOrigin;

          return {
            id: getTargetId(proxyOrigin) as number,
            tb: proxyOrigin.tripleBuffer,
          };
        },
        registerCollider(type, { rigidBodyId, ...args }) {
          // @ts-ignore
          const desc = getColliderDescConstructor(type)(...Object.values(args));
          const proxyOrigin = instantiationService.createInstance(Collider, this.world.createCollider(desc)) as Collider & IProxyOrigin;

          return {
            id: getTargetId(proxyOrigin) as number,
            tb: proxyOrigin.tripleBuffer,
          };
        },
        async step(tick: IEngineLoopTickContext, tasks): Promise<void> {
          this.tickManager.startTick(tick);
          await this.tickManager.runTickGroup(ETickGroup.PrePhysics);
          await this.tickManager.runTickGroup(ETickGroup.DuringPhysics);

          this.world.timestep = tick.delta;
          this.world.step();

          await this.tickManager.runTickGroup(ETickGroup.PostPhysics);
          this.tickManager.endTick();

          this.renderPort.postMessage({ type: 'physics-debug-buffers', ...this.world.debugRender() });
        },
      };

      Comlink.expose(context);

      console.log('RAPIER ready', context);
      self.postMessage({ type: 'init-response', tb: context.info.tripleBuffer });
    });
  }
}

type AnyColliderDescConstructor = (...args: [ProxyInstance['id'], ...unknown[]]) => RAPIER.ColliderDesc;

function getColliderDescConstructor<T extends RAPIER.ShapeType>(type: T): AnyColliderDescConstructor {
  const constructors: Record<RAPIER.ShapeType, ColliderDescConstructor> = {
    [RAPIER.ShapeType.Ball]: RAPIER.ColliderDesc.ball,
    [RAPIER.ShapeType.Capsule]: RAPIER.ColliderDesc.capsule,
    [RAPIER.ShapeType.Cone]: RAPIER.ColliderDesc.cone,
    [RAPIER.ShapeType.ConvexPolyhedron]: RAPIER.ColliderDesc.convexHull,
    [RAPIER.ShapeType.Cuboid]: RAPIER.ColliderDesc.cuboid,
    [RAPIER.ShapeType.Cylinder]: RAPIER.ColliderDesc.cylinder,
    [RAPIER.ShapeType.HalfSpace]: RAPIER.ColliderDesc.heightfield,
    [RAPIER.ShapeType.HeightField]: RAPIER.ColliderDesc.heightfield,
    [RAPIER.ShapeType.Polyline]: RAPIER.ColliderDesc.polyline,
    [RAPIER.ShapeType.RoundCone]: RAPIER.ColliderDesc.roundCone,
    [RAPIER.ShapeType.RoundConvexPolyhedron]: RAPIER.ColliderDesc.roundConvexHull,
    [RAPIER.ShapeType.RoundCuboid]: RAPIER.ColliderDesc.roundCuboid,
    [RAPIER.ShapeType.RoundCylinder]: RAPIER.ColliderDesc.roundCylinder,
    [RAPIER.ShapeType.RoundTriangle]: RAPIER.ColliderDesc.roundTriangle,
    [RAPIER.ShapeType.Segment]: RAPIER.ColliderDesc.segment,
    [RAPIER.ShapeType.TriMesh]: RAPIER.ColliderDesc.trimesh,
    [RAPIER.ShapeType.Triangle]: RAPIER.ColliderDesc.triangle,
  };

  return constructors[type] as AnyColliderDescConstructor;
}

function createRigidBodyDesc(type: RAPIER.RigidBodyType): RAPIER.RigidBodyDesc {
  if (type === RAPIER.RigidBodyType.Dynamic) {
    return RAPIER.RigidBodyDesc.dynamic();
  }
  if (type === RAPIER.RigidBodyType.Fixed) {
    return RAPIER.RigidBodyDesc.fixed();
  }
  if (type === RAPIER.RigidBodyType.KinematicPositionBased) {
    return RAPIER.RigidBodyDesc.kinematicPositionBased();
  }
  if (type === RAPIER.RigidBodyType.KinematicVelocityBased) {
    return RAPIER.RigidBodyDesc.kinematicVelocityBased();
  }

  throw new Error(`Unknown rigid body type.`);
}
