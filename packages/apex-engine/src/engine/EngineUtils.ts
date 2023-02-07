export class EngineUtils {
  public static hasDefinedTickMethod(target: object) {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(target)).includes('tick');
  }
}
