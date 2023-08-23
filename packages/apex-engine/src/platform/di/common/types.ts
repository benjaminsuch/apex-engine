export interface ServiceIdentifier<T> {
  (...args: any[]): void;
}

export type ServiceDependencies = { id: ServiceIdentifier<any>; index: number; optional: boolean };

export type TClass = { new (...args: any[]): any };

export type RegisteredService = { _injectibleService: undefined };

export type GetLeadingNonServiceArgs<TArgs extends any[]> = TArgs extends []
  ? []
  : TArgs extends [...infer TFirst, RegisteredService]
  ? GetLeadingNonServiceArgs<TFirst>
  : TArgs;

export type SingletonRegistry = [ServiceIdentifier<any>, new (...services: any[]) => any][];
