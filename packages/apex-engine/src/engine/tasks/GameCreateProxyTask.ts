import { TickTask } from '../TickFunctionManager';

export class GameCreateProxyTask extends TickTask {
  constructor(private readonly proxies: any[]) {
    super();
  }

  public run() {
    return true;
  }
}
