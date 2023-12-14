import { Level } from 'apex-engine/src/engine';

import { MyCube } from '../actors/MyCube';

export default class EntryLevel extends Level {
  public override init(): void {
    super.init();

    const myCube = this.getWorld().spawnActor(MyCube);
  }
}
