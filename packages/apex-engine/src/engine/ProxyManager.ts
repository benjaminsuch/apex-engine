import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { components } from './components';
import { type IProxyOrigin } from './core/class/specifiers/proxy';
import { type RenderProxy } from './renderer/RenderProxy';
import { IRenderWorkerContext } from './renderer/RenderWorkerContext';
import { ETickGroup, TickFunction } from './TickManager';

export interface IEnqueuedProxy<T> {
  target: T;
  args: unknown[];
}

export class ProxyManager<T> {
  private static instance?: ProxyManager<any>;

  // I don't like applying the singleton pattern for this class, but an architectural
  // issue with the proxies force me to do so.
  //
  // For context: Currently, I don't see a way to pass the instance of ProxyManager to
  // the class that is returned by our `proxy` specifier (see /class/specifiers/proxy.ts).
  public static getInstance(): ProxyManager<any> {
    if (!this.instance) {
      throw new Error(`There is no instance of ProxyManager.`);
    }
    return this.instance;
  }

  protected proxyQueue: IEnqueuedProxy<T>[] = [];

  public enqueueProxy(proxy: T, args: unknown[]): boolean {
    const idx = this.proxyQueue.findIndex(({ target }) => target === proxy);

    if (idx === -1) {
      this.proxyQueue.push({ target: proxy, args });
      return this.registerProxy(proxy);
    }

    return false;
  }

  protected readonly proxies: ProxyRegistry<T>;

  public registerProxy(proxy: T): boolean {
    return this.proxies.register(proxy);
  }

  protected managerTick: TickFunction<any>;

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (ProxyManager.instance) {
      throw new Error(`An instance of the ProxyManager already exists.`);
    }

    this.proxies = this.instantiationService.createInstance(ProxyRegistry);
    this.managerTick = this.instantiationService.createInstance(ProxyManagerTickFunction, this);

    this.registerTickFunctions();

    ProxyManager.instance = this;
  }

  public init(): void {}

  public tick(): void {}

  protected registerTickFunctions(): void {
    if (!this.managerTick.isRegistered) {
      this.managerTick.canTick = true;
      this.managerTick.tickGroup = ETickGroup.PostPhysics;
      this.managerTick.register();
    }
  }
}

export class GameProxyManager extends ProxyManager<IProxyOrigin> {
  public static override getInstance(): GameProxyManager {
    return super.getInstance() as GameProxyManager;
  }

  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderWorkerContext protected readonly renderWorker: IRenderWorkerContext
  ) {
    super(instantiationService, logger);
  }

  public override tick(): void {
    super.tick();

    if (this.proxyQueue.length > 0) {
      this.renderWorker.createProxies(this.proxyQueue);
      this.proxyQueue = [];
    }

    for (let i = 0; i < this.proxies.entries; ++i) {
      const proxy = this.proxies.getProxyByIndex(i);

      if (proxy) {
        proxy.tripleBuffer.copyToWriteBuffer(proxy.byteView);
      }
    }
  }
}

const proxyConstructors = { ...components };

export class RenderProxyManager extends ProxyManager<RenderProxy> {
  public static override getInstance(): RenderProxyManager {
    return super.getInstance() as RenderProxyManager;
  }

  public getProxyConstructor(id: string): TClass {
    return proxyConstructors[id as keyof typeof proxyConstructors];
  }

  public getProxy(id: number): RenderProxy | void {
    for (const proxy of this.proxies) {
      if (proxy.id === id) {
        return proxy;
      }
    }
  }
}

class ProxyRegistry<T> {
  private readonly list: T[] = [];

  public getProxyByIndex(idx: number): T | undefined {
    return this.list[idx];
  }

  public register(proxy: T): boolean {
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

  public *[Symbol.iterator](): Generator<T, any, any> {
    let idx = 0;

    while (idx < this.list.length) {
      yield this.list[idx++];
    }
  }
}

class ProxyManagerTickFunction extends TickFunction<ProxyManager<any>> {
  public override run(): void {
    this.target.tick();
  }
}
