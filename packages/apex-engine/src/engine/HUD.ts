import { el, type List, list, mount, type RedomComponent, setAttr, setChildren, setStyle, unmount } from 'redom';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Actor } from './Actor';
import { type IEngineLoopTickContext } from './EngineLoop';
import { IRenderWorkerContext } from './renderer/RenderWorkerContext';
import { TickManager } from './TickManager';
import { type World } from './World';

export class HUD extends Actor {
  private static instance?: HUD;

  public static getInstance(): HUD {
    if (!this.instance) {
      throw new Error(`There is no instance of HUD.`);
    }
    return this.instance;
  }

  private readonly canvas: HTMLCanvasElement;

  private readonly debugContainer: DebugContainer;

  private readonly hudContainer: HUDContainer;

  public isDebugEnabled: boolean = IS_DEV;

  public get debugInterval(): number {
    return this.debugContainer.intervalTime;
  }

  public set debugInterval(val: number) {
    this.debugContainer.intervalTime = val;
    this.debugContainer.restart();
  }

  public isInitialized: boolean = false;

  constructor(@IInstantiationService instantiationService: IInstantiationService, @IConsoleLogger logger: IConsoleLogger) {
    super(instantiationService, logger);

    this.canvas = el('canvas', { id: 'hud' });

    this.debugContainer = this.instantiationService.createInstance(DebugContainer);
    this.hudContainer = this.instantiationService.createInstance(HUDContainer);

    this.actorTick.canTick = true;

    HUD.instance = this;
  }

  public init(): void {
    this.logger.debug(this.constructor.name, `Initialize`);

    mount(document.body, this.canvas);
    mount(document.body, this.hudContainer);

    this.debugContainer.world = this.getWorld();

    if (this.isDebugEnabled) {
      this.showDebug();
      this.startDebug();
    }

    this.isInitialized = true;
  }

  public override tick({ id, delta, elapsed }: IEngineLoopTickContext): void | Promise<void> {
    this.debugContainer.tick.id = id;
    this.debugContainer.tick.delta = delta;
    this.debugContainer.tick.elapsed = elapsed;
  }

  public startDebug(): void {
    this.debugContainer.start();
  }

  public stopDebug(): void {
    this.debugContainer.stop();
  }

  public showDebug(): void {
    this.debugContainer.show();
  }

  public hideDebug(): void {
    this.debugContainer.hide();
  }

  public showDebugMessage(message: string, timeout: number = 1000): void {
    this.debugContainer.showMessage(message, timeout);
  }

  public createDebugMessage(): DebugMessage {
    return this.debugContainer.createMessage();
  }
}

class DebugContainer implements RedomComponent {
  private readonly messagesEl: List;

  private readonly stats: List;

  private intervalId: IntervalReturn;

  private messageInstances: DebugMessage[] = [];

  /**
   * The time in milliseconds in which the debug HUD gets updated.
   */
  public intervalTime: number = 250;

  public readonly tick: IEngineLoopTickContext;

  public readonly el: HTMLElement;

  public world: World | null = null;

  public messages: string[] = [];

  constructor(@IRenderWorkerContext private readonly renderContext: IRenderWorkerContext) {
    this.tick = { id: 0, delta: 0, elapsed: 0 };
    this.messagesEl = list('div', Span);
    this.el = el('div', this.messagesEl, this.stats = list('div', Span));

    setAttr(this.messagesEl, {
      id: 'debug-messages',
      style: { position: 'absolute', top: '1rem', left: '1rem', display: 'flex', flexDirection: 'column' },
    });

    setAttr(this.stats.el, {
      id: 'stats',
      style: { textAlign: 'right', position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column' },
    });

    setAttr(this.el, {
      id: 'debug',
      style: { fontFamily: 'monospace', position: 'fixed', top: 0, right: 0, left: 0, bottom: 0, zIndex: 1000 },
    });
  }

  public show(): void {
    mount(document.body, this.el);
  }

  public hide(): void {
    unmount(document.body, this.el);
  }

  public update(): void {
    const context = {
      tick: this.tick,
      fps: (1 / this.tick.delta).toFixed(0),
    };

    const world = this.world;
    const tickManager = TickManager.getInstance();
    const avgDelta = context.tick.elapsed / context.tick.id;
    const avgFPS = context.tick.id / (context.tick.elapsed / 1000);

    const data = [
      `Game-Thread`,
      `Tickrate: ${context.fps} (avg. ${avgFPS.toFixed(0)})`,
      `Tick Id: ${context.tick.id}`,
      `Tick Delta: ${(context.tick.delta * 1000).toFixed(2)}ms (avg. ${avgDelta.toFixed(2)}ms)`,
      `Time Elapsed: ${(context.tick.elapsed / 1000).toFixed(0)}s`,
      `Render-Thread`,
      `Elapsed: ${this.renderContext.getRenderingInfo().elapsed}`,
      `Delta: ${this.renderContext.getRenderingInfo().delta}`,
    ];

    if (world) {
      const actorCount = world.actors.length;
      const registeredTicksCount = tickManager.registeredTicksCount;
      const enabledTicksCount = tickManager.enabledTicksCount;

      data.push(
        `Level: ${world.getCurrentLevel().constructor.name}`,
        `Actors: ${actorCount}`,
        `Tick Functions (enabled/registered): ${enabledTicksCount}/${registeredTicksCount}`,
      );
    }

    this.stats.update(data, context);
    this.messagesEl.update([...this.messageInstances.map(instance => instance.value), ...this.messages]);
  }

  public start(): void {
    this.intervalId = setInterval(() => {
      this.update();
    }, this.intervalTime);
  }

  public stop(): void {
    clearInterval(this.intervalId as number);
  }

  public restart(): void {
    this.stop();
    this.start();
  }

  public createMessage(): DebugMessage {
    const message = new DebugMessage(this);
    this.messageInstances.push(message);
    return message;
  }

  public destroyMessage(message: DebugMessage): void {
    const idx = this.messageInstances.findIndex(item => item === message);
    this.messageInstances.removeAtSwap(idx);
  }

  public showMessage(message: string, timeout: number = 1000): void {
    this.messages.push(message);

    setTimeout(() => {
      this.messages.removeAtSwap(0);
    }, timeout + this.intervalTime * this.messages.length);
  }
}

class Span implements RedomComponent {
  public readonly el: HTMLSpanElement;

  constructor() {
    this.el = el('span');
  }

  update(...args: any[]): void {
    this.el.textContent = args[0];
  }
}

class HUDContainer implements RedomComponent {
  public readonly el: HTMLDivElement;

  constructor() {
    this.el = el('div');

    setAttr(this.el, {
      id: 'hud',
      style: { position: 'fixed', top: 0, right: 0, left: 0, bottom: 0, zIndex: 900 },
    });
  }

  public update(): void {

  }
}

export class DebugMessage {
  constructor(private readonly debugContainer: DebugContainer, public value: string = '') {}

  public destroy(): void {
    this.debugContainer.destroyMessage(this);
  }
}
