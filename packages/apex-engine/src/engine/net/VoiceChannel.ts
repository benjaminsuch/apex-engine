import { DataChannel } from './DataChannel';

export class VoiceChannel extends DataChannel {
  public override tickOnCreate: boolean = true;
}
