import { type InputComponent } from './components';
import { Actor } from './Actor';

export class DefaultPawn extends Actor {
  private inputBindingsInitialized: boolean = false;

  public setupInputComponent(component: InputComponent) {
    this.initInputBindings();
  }

  private initInputBindings() {
    if (!this.inputBindingsInitialized) {
      this.inputBindingsInitialized = true;
    }
  }
}
