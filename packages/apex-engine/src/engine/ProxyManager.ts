import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderPlatform, type TRenderRPCData } from '../platform/rendering/common';
import { getTargetId } from './class';
import { type TProxyConstructor, type IProxy } from './class/specifiers/proxy';
import * as components from './components';
import { BoxGeometryProxy } from './BoxGeometry';
import { type Tick } from './EngineLoop';
import { ProxyTask } from './ProxyTask';

export class ProxyManager {
  private static instance?: ProxyManager;

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

  protected readonly proxies: ProxyRegistry;

  public registerProxy(proxy: IProxy) {
    return this.proxies.register(proxy);
  }

  protected readonly tasks: ProxyTask<any>[] = [];

  public queueTask<T extends new (...args: any[]) => ProxyTask<any>>(
    TaskConstructor: T,
    //todo: Re-add `never` to `? R : any`
    ...args: [T extends typeof ProxyTask<infer R> ? R : any, ...any[]]
  ) {
    //todo: Improve types
    this.tasks.push(this.instantiationService.createInstance(TaskConstructor as TClass, ...args));
    return true;
  }

  public currentTick: Tick = { delta: 0, elapsed: 0, id: 0 };

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

  public tick(tick: Tick) {
    this.currentTick = tick;

    for (let i = 0; i < this.tasks.length; ++i) {
      const task = this.tasks[i];

      this.logger.debug(`Start ${task.constructor.name}`);

      if (task.run(this)) {
        this.logger.debug(`${task.constructor.name} done`);
        // See comment below
        // this.tasks.splice(i, 1);
        // i--;
      } else {
        //todo: Replace with `IS_DEV` (the variable does not exist in worker context)
        if (true) {
          this.logger.debug(`${task.constructor.name} failed`);
        } else {
          this.logger.warn(this.constructor.name, `"${task.constructor.name}" failed.`);
        }
      }
      // If the render-thread is too fast, the proxy tasks added by the game-thread
      // won't be executed by the render-thread, because it is already 1 or more ticks
      // ahead. Example: If we have a RenderCreateProxyTask added at (game) tick 2,
      // and the (render) tick is already at 3 at the time it receives the task, the
      // render-thread will never execute that task (because it's in the past).
      //
      // To properly solve this, we have to make sure that either:
      // - the game-thread is always ahead
      // - or we execute tasks that were sent x ticks ago
      //
      // todo: Remove this when the above gets fixed.
      this.tasks.splice(i, 1);
      i--;
    }
  }
}

export class GameProxyManager extends ProxyManager {
  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderPlatform protected readonly renderer: IRenderPlatform
  ) {
    super(instantiationService, logger);
  }

  public send(message: any, transferable?: Transferable[]) {
    this.renderer.send(message, transferable);
  }
}

export class RenderProxyManager extends ProxyManager {
  public readonly components = { ...components, BoxGeometryProxy };

  public getProxy(id: number) {
    for (const proxy of this.proxies) {
      if (proxy.id === id) {
        return proxy;
      }
    }
  }
}

export class GameRPCTask extends ProxyTask<Omit<TRenderRPCData, 'tick'>> {
  constructor(
    public override readonly data: Omit<TRenderRPCData, 'tick'>,
    private readonly proxy: IProxy,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(data, instantiationService, logger);
  }

  public run(proxyManager: GameProxyManager) {
    this.proxy.proxyMessageChannel.port1.postMessage({
      ...this.data,
      type: 'rpc',
      tick: proxyManager.currentTick.id
    });

    return true;
  }
}

export class GameCreateProxyInstanceTask extends ProxyTask<IProxy> {
  public run(proxyManager: GameProxyManager) {
    const messagePort = this.data.getProxyMessagePort();
    const constructor = (this.data.constructor as TProxyConstructor).proxyClassName;

    proxyManager.send(
      {
        type: 'proxy',
        constructor,
        id: getTargetId(this.data) as number,
        tb: this.data.tripleBuffer,
        messagePort,
        tick: proxyManager.currentTick.id
      },
      [messagePort]
    );

    return true;
  }
}

class ProxyRegistry {
  private readonly list: IProxy[] = [];

  public register(proxy: IProxy) {
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
