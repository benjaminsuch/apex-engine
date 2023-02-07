import { ILogger } from './types';

export abstract class AbstractLogger implements ILogger {
  public abstract debug(message: string, ...args: any[]): void;
  public abstract error(message: string, ...args: any[]): void;
  public abstract info(message: string, ...args: any[]): void;
  public abstract warn(message: string, ...args: any[]): void;
}
