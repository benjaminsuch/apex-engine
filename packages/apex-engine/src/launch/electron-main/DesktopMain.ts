import { BrowserWindow } from 'electron';

import { InstantiationService, ServiceCollection } from 'src/platform/di/common';
import { ConsoleLogger, IConsoleLogger } from 'src/platform/logging/common';

export class DesktopMain {
  private readonly instantiationService: InstantiationService;

  private window?: BrowserWindow;

  constructor(args: string[]) {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    //? We have to keep in mind, that this window can be modified by the engine
    //? during runtime (e.g. the user changes the game resolution).
    this.window = new BrowserWindow({
      autoHideMenuBar: true,
      //frame: false,
      height: 1080,
      width: 1920,
      show: false,
      title: 'Apex Engine | Electron',
      webPreferences: {
        enableWebSQL: false,
        sandbox: true,
        spellcheck: false
      }
    });

    this.window.on('ready-to-show', () => {
      this.window?.show();
    });

    if (process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(process.env['ELECTRON_RENDERER_URL']);
    }
  }
}
