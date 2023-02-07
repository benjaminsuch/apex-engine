import type { ServiceIdentifier } from './types';

export class ServiceCollection {
  private readonly entries = new Map<ServiceIdentifier<any>, any>();

  constructor(...entries: [ServiceIdentifier<any>, any][]) {
    for (const [id, service] of entries) {
      this.set(id, service);
    }
  }

  public set<T>(id: ServiceIdentifier<T>, instance: T): T {
    const result = this.entries.get(id);
    this.entries.set(id, instance);
    return result;
  }

  public has(id: ServiceIdentifier<any>): boolean {
    return this.entries.has(id);
  }

  public get<T>(id: ServiceIdentifier<T>): T {
    return this.entries.get(id);
  }
}
