import { type Vector3 } from 'three';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type InputComponent } from './components/InputComponent';
import { type InputMappingContext } from './InputMappingContext';

export class PlayerInput {
  private readonly inputMappings: InputMappingContext[] = [];

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    if (IS_BROWSER) {
      window.addEventListener('contextmenu', this);
      window.addEventListener('keydown', this);
      window.addEventListener('keyup', this);
      window.addEventListener('mousedown', this);
      window.addEventListener('mousemove', this);
      window.addEventListener('mouseup', this);
    }
  }

  public processInputStack(inputStack: InputComponent[], delta: number): void {

  }

  public addMappingContext(mapping: InputMappingContext): void {
    const idx = this.inputMappings.findIndex(item => item === mapping);

    if (idx > -1) {
      return;
    }

    this.inputMappings.push(mapping);
  }

  public removeMappingContext(mapping: InputMappingContext): void {
    const idx = this.inputMappings.findIndex(item => item === mapping);

    if (idx > -1) {
      this.inputMappings.splice(idx, 1, this.inputMappings[this.inputMappings.length - 1]).pop();
    }
  }

  public handleEvent(event: KeyboardEvent | MouseEvent | PointerEvent | TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'contextmenu') this.handleContextMenu(event as PointerEvent);
    if (event.type === 'keydown') this.handleKeyDown(event as KeyboardEvent);
    if (event.type === 'keyup') this.handleKeyUp(event as KeyboardEvent);
    if (event.type === 'mousedown') this.handleMouseDown(event as MouseEvent);
    if (event.type === 'mousemove') this.handleMouseMove(event as MouseEvent);
    if (event.type === 'mouseup') this.handleMouseUp(event as MouseEvent);
  }

  private handleContextMenu(event: PointerEvent): void {}

  private handleMouseMove({ movementX: x, movementY: y }: MouseEvent): void {}

  private handleMouseDown(event: MouseEvent): void {}

  private handleMouseUp(event: MouseEvent): void {}

  private handleKeyDown(event: KeyboardEvent): void {}

  private handleKeyUp(event: KeyboardEvent): void {
    console.log(event);
  }
}

export enum EKeyEvent {
  DoubleClick,
  Pressed,
  Released,
}
