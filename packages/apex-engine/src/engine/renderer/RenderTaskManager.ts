import { getTargetId } from '../core/class/decorators';
import { filterArgs, type IProxyOrigin } from '../core/class/specifiers/proxy';

export type AnyRenderWorkerTask = RenderWorkerTask<IProxyOrigin, string, any[]>;

export class RenderTaskManager {
  private static tasks: AnyRenderWorkerTask[] = [];

  public static addTask<Task extends AnyRenderWorkerTask>(task: Task): number {
    return this.tasks.push(task) - 1;
  }

  public static removeTask(idx: number): void {
    return this.tasks.removeAtSwap(idx);
  }

  public static getTasks(): AnyRenderWorkerTask[] {
    return this.tasks;
  }

  public static clear(): void {
    this.tasks = [];
  }
}

export interface RenderWorkerTaskJSON {
  readonly target: number;
  readonly name: string;
  readonly params: any[];
  readonly tick: number;
}

// @todo: Inform users in the documentation, to be careful/reasonable with task parameters
export abstract class RenderWorkerTask<T extends IProxyOrigin, N extends string, P extends Array<unknown> = []> {
  constructor(public readonly target: T, public readonly name: N, public readonly params: P, public readonly tick: number) {}

  public toJSON(): RenderWorkerTaskJSON {
    return {
      target: getTargetId(this.target) as number,
      name: this.name,
      params: filterArgs(this.params),
      tick: this.tick,
    };
  }
}
