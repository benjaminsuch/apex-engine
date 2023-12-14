import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderingPlatform } from '../platform/rendering/common';
import { type IProxyOrigin } from './class/specifiers/proxy';
import * as components from './components';
import { type RenderProxy, type Renderer } from './renderer';
import { BoxGeometryProxy } from './BoxGeometry';
import { BufferGeometryProxy } from './BufferGeometry';
import { type IEngineLoopTick } from './EngineLoop';
import { ProxyTask } from './ProxyTask';

export class ProxyManager<T> {
  protected static instance?: ProxyManager<any>;

  // I don't like applying the singleton pattern for this class, but an architectural
  // issue with the proxies force me to do so.
  //
  // For context: Currently, I don't see a way to pass the instance of ProxyManager to
  // the class that is returned by our `proxy` specifier (see /class/specifiers/proxy.ts).
  public static getInstance() {
    if (!this.instance) {
      throw new Error(`There is no instance of ProxyManager.`);
    }
    return this.instance;
  }

  protected queuedProxies: any[] = [];

  protected readonly proxies: ProxyRegistry<T>;

  public registerProxy(proxy: T) {
    this.queuedProxies.push(proxy);
    return this.proxies.register(proxy);
  }

  protected readonly tasks: ProxyTask<any>[] = [];

  public currentTick: IEngineLoopTick = { delta: 0, elapsed: 0, id: 0 };

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (ProxyManager.instance) {
      throw new Error(`An instance of the ProxyManager already exists.`);
    }

    this.proxies = this.instantiationService.createInstance(ProxyRegistry);

    ProxyManager.instance = this;
    console.log('ProxyManager', this);
  }

  public queueTask<T extends new (...args: any[]) => ProxyTask<any>>(
    TaskConstructor: T,
    //todo: Re-add `never` to `? R : any`
    ...args: [T extends typeof ProxyTask<infer R> ? R : any, ...any[]]
  ) {
    //todo: Improve types
    this.tasks.push(this.instantiationService.createInstance(TaskConstructor as TClass, ...args));
    return true;
  }

  public tick(tick: IEngineLoopTick) {
    this.currentTick = tick;

    // for (let i = 0; i < this.tasks.length; ++i) {
    //   const task = this.tasks[i];

    //   this.logger.debug(task.constructor.name, 'Start');

    //   if (task.run(this)) {
    //     this.logger.debug(task.constructor.name, 'Done');
    //     // See comment below
    //     // this.tasks.splice(i, 1);
    //     // i--;
    //   } else {
    //     //todo: Replace with `IS_DEV` (the variable does not exist in worker context)
    //     if (true) {
    //       this.logger.debug(`${task.constructor.name} failed`);
    //     } else {
    //       this.logger.warn(this.constructor.name, `"${task.constructor.name}" failed.`);
    //     }
    //   }
    //   // If the render-thread is too fast, the proxy tasks added by the game-thread
    //   // won't be executed by the render-thread, because it is already 1 or more ticks
    //   // ahead. Example: If we have a RenderCreateProxyTask added at (game) tick 2,
    //   // and the (render) tick is already at 3 at the time it receives the task, the
    //   // render-thread will never execute that task (because it's in the past).
    //   //
    //   // To properly solve this, we have to make sure that either:
    //   // - the game-thread is always ahead
    //   // - or we execute tasks that were sent x ticks ago
    //   //
    //   // todo: Remove this when the above gets fixed.
    //   // this.tasks.splice(i, 1);
    //   // i--;
    // }

    //todo: To run `tick` inside `ProxyManager` we have to make sure it's guaranteed `proxy` has that method.
    // for (let i = 0; i < this.proxies.entries; ++i) {
    //   const proxy = this.proxies.getProxyByIndex(i)
    //   proxy.tick(tick);
    // }
  }

  public tickEnd() {
    for (let i = 0; i < this.tasks.length; ++i) {
      const task = this.tasks[i];

      if (task.tickEnd(this)) {
        // this.tasks.splice(i, 1);
        // i--;
      } else {
        this.logger.warn(this.constructor.name, `"${task.constructor.name}" failed.`);
      }

      //todo: Remove
      this.tasks.splice(i, 1);
      i--;
    }
  }
}

export class GameProxyManager extends ProxyManager<IProxyOrigin> {
  public static override getInstance() {
    return super.getInstance() as GameProxyManager;
  }

  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderingPlatform protected readonly renderer: IRenderingPlatform
  ) {
    super(instantiationService, logger);
  }

  public send(message: any, transferable?: Transferable[]) {
    this.renderer.send(message, transferable);
  }
}

export class RenderProxyManager extends ProxyManager<RenderProxy> {
  public static override getInstance() {
    return super.getInstance() as RenderProxyManager;
  }

  /**
   * Holds all scene proxies that should be added to the rendering scene.
   * The list is processed at the end of each tick.
   *
   * Important: Only scene proxies that have no parent are added to the rendering scene.
   */
  private unattachedSceneProxies: components.SceneComponentProxy[] = [];

  public readonly components = { ...components, BoxGeometryProxy, BufferGeometryProxy };

  constructor(
    private readonly renderer: Renderer,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);
  }

  public getProxy(id: number) {
    for (const proxy of this.proxies) {
      if (proxy.id === id) {
        return proxy;
      }
    }
  }

  public override registerProxy(proxy: RenderProxy): boolean {
    if (proxy instanceof components.SceneComponentProxy) {
      this.unattachedSceneProxies.push(proxy);
    }
    return super.registerProxy(proxy);
  }

  public override tick(tick: IEngineLoopTick): void {
    super.tick(tick);

    for (let i = 0; i < this.proxies.entries; ++i) {
      const proxy = this.proxies.getProxyByIndex(i);
      proxy.tick(tick);
    }
  }

  public override tickEnd(): void {
    super.tickEnd();

    for (let i = 0; i < this.unattachedSceneProxies.length; ++i) {
      const proxy = this.unattachedSceneProxies[i];

      if (!proxy.parent && proxy.sceneObject) {
        this.renderer.scene.add(proxy.sceneObject);
      }
    }

    this.unattachedSceneProxies = [];
  }
}

class ProxyRegistry<T> {
  private readonly list: T[] = [];

  public getProxyByIndex(idx: number) {
    return this.list[idx];
  }

  public register(proxy: T) {
    const idx = this.list.indexOf(proxy);

    if (idx > -1) {
      this.logger.warn(`Proxy is already registered. Aborting.`);
      return false;
    }

    this.entries = this.list.push(proxy);

    return true;
  }

  public entries: number = 0;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {}

  public *[Symbol.iterator]() {
    let idx = 0;

    while (idx < this.list.length) {
      yield this.list[idx++];
    }
  }
}
