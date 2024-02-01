import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { getTargetId } from './core/class/decorators';
import { EProxyThread, type IProxyOrigin } from './core/class/specifiers/proxy';
import { type IEngineLoopTickContext } from './EngineLoop';
import { ProxyInstance } from './ProxyInstance';
import { ETickGroup, TickFunction } from './TickManager';

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

  protected proxyQueue: RegisteredProxy<T>[][] = [];

  public enqueueProxy(thread: EProxyThread, proxy: T, args: unknown[]): boolean {
    const idx = this.proxyQueue[thread].findIndex(({ target }) => target === proxy);

    if (idx === -1) {
      const enqueuedProxy = new EnqueuedProxy(thread, proxy, args);
      enqueuedProxy.index = this.proxyQueue[thread].push(enqueuedProxy) - 1;
      this.registerProxy(proxy, thread);
      return true;
    }

    return false;
  }

  public readonly proxies: ProxyRegistry<RegisteredProxy<T>>;

  public registerProxy(proxy: T, thread: EProxyThread = this.thread): void {
    const registeredProxy = new RegisteredProxy(thread, proxy);
    registeredProxy.index = this.proxies.register(registeredProxy);
  }

  public getProxy(id: number, thread: EProxyThread = this.thread): T | void {
    for (const proxy of this.proxies) {
      if (proxy.thread === thread) {
        const proxyId = proxy.target instanceof ProxyInstance ? proxy.target.id : getTargetId(proxy.target);

        if (proxyId === id) {
          return proxy.target;
        }
      }
    }
  }

  protected managerTick: TickFunction<any>;

  constructor(
    public readonly thread: EProxyThread,
    private readonly proxyConstructors: Record<string, TClass> = {},
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (ProxyManager.instance) {
      throw new Error(`An instance of the ProxyManager already exists.`);
    }

    for (let i = 0; i < EProxyThread.MAX; ++i) {
      this.proxyQueue[i] = [];
    }

    this.proxies = this.instantiationService.createInstance(ProxyRegistry);
    this.managerTick = this.instantiationService.createInstance(ProxyManagerTickFunction, this);

    this.registerTickFunctions();

    ProxyManager.instance = this;
  }

  public init(): void {}

  public tick(tick: IEngineLoopTickContext): void {
    if (this.proxyQueue.length > 0) {
      if (this.onProcessProxyQueue(tick)) {
        this.proxyQueue = [];
      }
    }

    for (let i = 0; i < this.proxies.entries; ++i) {
      const proxy = this.proxies.getProxyByIndex(i);

      if (proxy) {
        const target = proxy.target as IProxyOrigin;

        if (!(target instanceof ProxyInstance)) {
          target.tripleBuffer.copyToWriteBuffer(target.byteView);
        }
      }
    }
  }

  public getProxyConstructor(id: string): TClass {
    return this.proxyConstructors[id];
  }

  /**
   * This method will be called each tick and only if `proxyQueue` is not empty.
   * Use it to modify how `proxyQueue` will be processed.
   *
   * @param tick
   * @returns Returning `true` will reset `proxyQueue` to an empty array.
   */
  protected onProcessProxyQueue(tick: IEngineLoopTickContext): boolean {
    return false;
  }

  protected registerTickFunctions(): void {
    if (!this.managerTick.isRegistered) {
      this.managerTick.canTick = true;
      this.managerTick.tickGroup = ETickGroup.PostPhysics;
      this.managerTick.register();
    }
  }
}

class ProxyRegistry<T> {
  private readonly list: T[] = [];

  public getProxyByIndex(idx: number): T | undefined {
    return this.list[idx];
  }

  /**
   * @param registeredProxy
   * @returns Index of where the proxy is in our list of registered proxies.
   */
  public register(registeredProxy: T): number {
    this.entries = this.list.push(registeredProxy);
    return this.entries - 1;
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
  public override run(tick: IEngineLoopTickContext): void {
    this.target.tick(tick);
  }
}

export class RegisteredProxy<T> {
  public index: number = -1;

  constructor(public readonly thread: EProxyThread, public readonly target: T) {}
}

export class EnqueuedProxy<T> extends RegisteredProxy<T> {
  constructor(thread: EProxyThread, target: T, public readonly args: unknown[]) {
    super(thread, target);
  }
}
