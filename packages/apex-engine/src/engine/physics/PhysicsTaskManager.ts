import { filterArgs } from '../core/class/specifiers/proxy';
import { type ProxyInstance } from '../ProxyInstance';

export type AnyPhysicsWorkerTask = PhysicsWorkerTask<ProxyInstance, string, any[]>;

export class PhysicsTaskManager {
  private static tasks: AnyPhysicsWorkerTask[] = [];

  public static addTask<Task extends AnyPhysicsWorkerTask>(task: Task): number {
    return this.tasks.push(task) - 1;
  }

  public static removeTask(idx: number): void {
    return this.tasks.removeAtSwap(idx);
  }

  public static getTasks(): AnyPhysicsWorkerTask[] {
    return this.tasks;
  }

  public static clear(): void {
    this.tasks = [];
  }
}

export interface PhysicsWorkerTaskJSON {
  readonly proxy: number;
  readonly name: string;
  readonly params: any[];
}

// @todo: Inform users in the documentation, to be careful/reasonable with task parameters
export abstract class PhysicsWorkerTask<T extends ProxyInstance, N extends string, P extends Array<unknown> = []> {
  constructor(public readonly target: T, public readonly name: N, public readonly params: P) {}

  public toJSON(): PhysicsWorkerTaskJSON {
    return {
      proxy: this.target.id,
      name: this.name,
      params: filterArgs(this.params),
    };
  }
}
