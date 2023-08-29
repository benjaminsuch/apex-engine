import { DataChannel } from './DataChannel';

export class ControlChannel extends DataChannel {
  public override tickOnCreate: boolean = true;
}
