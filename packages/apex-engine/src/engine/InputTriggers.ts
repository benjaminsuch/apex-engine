export enum ETriggerEvent {
  None,
  Triggered,
  Started,
  Ongoing,
  Canceled,
  Completed,
}

export abstract class InputTrigger {
  public abstract run(): any;
}
