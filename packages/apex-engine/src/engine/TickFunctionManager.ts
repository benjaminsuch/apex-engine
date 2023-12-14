import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';

export enum ETickGroup {
  PrePhysics,
  DuringPhysics,
  PostPhysics,
  MAX
}

//todo: Keep track of tick time
export class TickFunctionManager {
  private static instance?: TickFunctionManager;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of TickFunctionManager available.`);
    }
    return this.instance;
  }

  /**
   * Contains all tick functions, unsorted, in the order they have been added.
   */
  private readonly tickFunctions: TickFunction<any>[] = [];

  /**
   * Stores the tick function's `run` method for each tick group, sorted by topologial sorting.
   */
  private readonly tickGroups: TickFunction<any>['run'][][] = [];

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (TickFunctionManager.instance) {
      throw new Error(`An instance of TickFunctionManager already exists.`);
    }

    for (let i = 0; i < ETickGroup.MAX; ++i) {
      this.tickGroups.push([]);
    }

    TickFunctionManager.instance = this;
  }

  public addTickFunction<T extends TickFunction<any>>(tickFunction: T): boolean {
    if (!this.tickFunctions.includes(tickFunction)) {
      tickFunction.index = this.tickFunctions.push(tickFunction) - 1;
      return true;
    }
    return false;
  }

  public startTick() {
    // We do topological sorting using Kahn's algorithm (https://en.wikipedia.org/wiki/Topological_sorting)
    for (let i = 0; i < this.tickFunctions.length; ++i) {
      const tickFunction = this.tickFunctions[i];
      const dependencies = tickFunction.dependencies;

      for (let j = 0; j < dependencies.length; ++j) {
        const dependency = this.tickFunctions[dependencies[j].index];

        if (dependency.tickGroup >= tickFunction.tickGroup) {
          dependency.indegree++;
        }
      }
    }

    const queue: TickFunction<any>[] = [];

    for (let i = 0; i < this.tickFunctions.length; ++i) {
      const tickFunction = this.tickFunctions[i];

      if (tickFunction.indegree === 0) {
        queue.push(tickFunction);
      }
    }

    let iterations = 0;

    while (queue.length > 0) {
      const tickFunction = queue.shift()!;

      if (tickFunction.isEnabled) {
        this.tickGroups[tickFunction.tickGroup].push(tickFunction.run);
      }

      for (let i = 0; i < tickFunction.dependencies.length; ++i) {
        const dependency = tickFunction.dependencies[i];
        const node = this.tickFunctions[dependency.index];

        if (node && --node.indegree === 0) {
          queue.push(node);
        }
      }

      iterations++;
    }

    if (iterations !== this.tickFunctions.length) {
      throw Error(`Dependency cycle detected.`);
    }
  }

  public endTick() {
    for (let i = 0; i < ETickGroup.MAX; ++i) {
      this.tickGroups[i] = [];
    }
  }

  //todo: Should we push rejected tasks into the next tick?
  public runTickGroup(group: ETickGroup) {
    return Promise.all(this.tickGroups[group]);
  }
}

export class TickFunction<T> {
  /**
   * A list of tick functions that this tick function depends on.
   *
   * Important: If one of the dependencies is in an earlier tick group,
   * that dependency will be ignored! Make sure a dependency is in the same
   * or later tick group.
   */
  public readonly dependencies: TickFunction<any>[] = [];

  public isRegistered: boolean = false;

  public isEnabled: boolean = true;

  public canTick: boolean = false;

  public canTickWhenPaused: boolean = false;

  public tickGroup: ETickGroup = ETickGroup.PrePhysics;

  /**
   * The index of where this tick function is stored.
   */
  public index: number = 0;

  /**
   * The number of tick functions that depend on this tick function.
   */
  public indegree: number = 0;

  constructor(public readonly target: T) {}

  /**
   * The function that executes the code that is being written
   *
   * @returns boolean
   */
  public async run(): Promise<boolean> {
    //todo: Silently reject when the tick is about to end or the function is taking too long
    //todo: Trigger event "FunctionTaskCompletion"
    return true;
  }

  public register() {
    if (!this.isRegistered) {
      TickFunctionManager.getInstance().addTickFunction(this);
    }
  }

  /**
   * Adds a tick function dependency if both, the target and the parameter have
   * `canTick` set to `true`.
   *
   * @param tickFunction
   */
  public addDependency<T extends TickFunction<any>>(tickFunction: T) {
    if (this.canTick && tickFunction.canTick) {
      if (!this.dependencies.includes(tickFunction)) {
        this.dependencies.push(tickFunction);
      }
    }
  }

  public removeDependency<T extends TickFunction<any>>(tickFunction: T) {
    const idx = this.dependencies.indexOf(tickFunction);

    if (idx > -1) {
      this.dependencies.splice(idx, 1);
    }
  }
}
