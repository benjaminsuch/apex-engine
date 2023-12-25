export interface ILogger {
  debug(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
}

export abstract class AbstractLogger implements ILogger {
  public abstract debug(message: string, ...args: any[]): void;
  public abstract error(message: string, ...args: any[]): void;
  public abstract info(message: string, ...args: any[]): void;
  public abstract warn(message: string, ...args: any[]): void;
}
