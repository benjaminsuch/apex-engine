import { ServiceCollection } from './ServiceCollection';
import type {
  GetLeadingNonServiceArgs,
  RegisteredService,
  ServiceDependencies,
  ServiceIdentifier,
  SingletonRegistry
} from './types';

const DI_TARGET = '$di$target';
const DI_DEPENDENCIES = '$di$dependencies';

export interface IInstatiationService {
  readonly _injectibleService: undefined;
  createInstance<C extends new (...args: any[]) => any, R extends InstanceType<C>>(
    Constructor: C,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<C>>
  ): R;
}

export class InstantiationService implements IInstatiationService {
  declare readonly _injectibleService: undefined;

  private static readonly registeredServices = new Map<string, ServiceIdentifier<any>>();

  private static registerServiceDependency(id: Function, target: Function, index: number): void {
    const service = target as any;

    if (service[DI_TARGET] === target) {
      service[DI_DEPENDENCIES].push({ id, index });
    } else {
      service[DI_DEPENDENCIES] = [{ id, index }];
      service[DI_TARGET] = target;
    }
  }

  private static getServiceDependencies(Constructor: any): ServiceDependencies[] {
    return Constructor[DI_DEPENDENCIES] ?? [];
  }

  public static createDecorator<T>(serviceId: string): ServiceIdentifier<T> {
    if (this.registeredServices.has(serviceId)) {
      return this.registeredServices.get(serviceId) as ServiceIdentifier<T>;
    }

    const id = function (target: Function, key: string, index: number): any {
      if (arguments.length !== 3) {
        throw new Error('@IServiceName-decorator can only be used to decorate a parameter');
      }
      InstantiationService.registerServiceDependency(id, target, index);
    };

    id.toString = () => serviceId;

    this.registeredServices.set(serviceId, id);

    return id;
  }

  private static readonly singletonRegistry: SingletonRegistry = [];

  public static registerSingleton<T, Services extends RegisteredService[]>(
    id: ServiceIdentifier<T>,
    Constructor: new (...services: Services) => T
  ): void {
    this.singletonRegistry.push([id, Constructor]);
  }

  public static getSingletonServices(): SingletonRegistry {
    return this.singletonRegistry;
  }

  constructor(private readonly services: ServiceCollection = new ServiceCollection()) {
    this.services.set(IInstatiationService, this);
  }

  public createInstance<C extends new (...args: any[]) => any, R extends InstanceType<C>>(
    Constructor: C,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<C>>
  ): R {
    const serviceDependencies = InstantiationService.getServiceDependencies(Constructor).sort(
      (a, b) => a.index - b.index
    );
    const serviceArgs: any[] = [];

    for (const dependency of serviceDependencies) {
      const service = this.services.get(dependency.id);

      if (!service) {
        throw new Error(
          `[createInstance] ${Constructor.name} depends on UNKNOWN service "${dependency.id}".`
        );
      }

      serviceArgs.push(service);
    }

    const firstServiceArgPos =
      serviceDependencies.length > 0 ? serviceDependencies[0].index : args.length;

    // Making sure the order of args matches the order of services
    if (args.length !== firstServiceArgPos) {
      console.trace(
        `[createInstance] First service dependency of ${Constructor.name} at position ${
          firstServiceArgPos + 1
        } conflicts with ${args.length} static arguments`
      );

      const delta = firstServiceArgPos - args.length;

      if (delta > 0) {
        args = args.concat(new Array(delta) as any) as any;
      } else {
        args = args.slice(0, firstServiceArgPos) as any;
      }
    }

    return Reflect.construct<ConstructorParameters<C>, R>(
      Constructor,
      args.concat(serviceArgs) as Readonly<ConstructorParameters<C>>
    );
  }
}

export const IInstatiationService =
  InstantiationService.createDecorator<IInstatiationService>('instantiationService');
