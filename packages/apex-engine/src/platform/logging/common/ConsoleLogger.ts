import { InstantiationService } from '../../../platform/di/common';
import { AbstractLogger, type ILogger } from './AbstractLogger';

export class ConsoleLogger extends AbstractLogger implements IConsoleLogger {
  declare readonly _injectibleService: undefined;

  public debug(message: string, ...args: any[]): void {
    console.log('%cDEBUG', 'background: #eee; color: #888', message, ...args);
  }

  public error(message: string, ...args: any[]): void {
    console.log('%cERROR', 'color: #f33', message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    console.log('%cINFO', 'color: #42e9f5', message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    console.log('%cWARN', 'color: #993', message, ...args);
  }
}

export interface IConsoleLogger extends ILogger {
  readonly _injectibleService: undefined;
}

export const IConsoleLogger = InstantiationService.createDecorator<IConsoleLogger>('consoleLogger');
