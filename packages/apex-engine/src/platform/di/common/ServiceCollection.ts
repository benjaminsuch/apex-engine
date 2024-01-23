/**
 * This code is from the VSCode instantiation service.
 *
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Link: https://github.com/microsoft/vscode/blob/main/src/vs/platform/instantiation/common/serviceCollection.ts
 */
export interface IServiceIdentifier<T> {
  (...args: any[]): void;
}

export class ServiceCollection {
  private readonly entries = new WeakMap<IServiceIdentifier<any>, any>();

  constructor(...entries: [IServiceIdentifier<any>, any][]) {
    for (const [id, service] of entries) {
      this.set(id, service);
    }
  }

  public set<T>(id: IServiceIdentifier<T>, instance: T): T {
    const result = this.entries.get(id);
    this.entries.set(id, instance);
    return result;
  }

  public has(id: IServiceIdentifier<any>): boolean {
    return this.entries.has(id);
  }

  public get<T>(id: IServiceIdentifier<T>): T {
    return this.entries.get(id);
  }
}
