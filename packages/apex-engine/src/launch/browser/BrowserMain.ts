import { InstantiationService, ServiceCollection } from '../../platform/di/common';

export class BrowserMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    // - `./platform` beinhaltet weiterhin Services die nach wie vor registriert werden
    // - Plugins die in `apex.config.ts` definiert (es wird nur der Name des npm package angegeben) wurden,
    //   werden zunächst aufgelöst und geladen (allerdings wird noch kein Plugin-Code ausgeführt).
    // - Als erstes werden die wichtigsten Engine Module geladen, dann die Phase "EarliestPossible" angestoßen
    // - Module durchlaufen den Load/Init-Lifecycle der Engine
    const services = new ServiceCollection();

    this.instantiationService = new InstantiationService(services);
  }

  public init() {

  }
}
