import { Pawn } from './Pawn';

export class DefaultPawn extends Pawn {}

// We need a default export for our default-class loading in `EngineLoop.init`.
export default DefaultPawn;
