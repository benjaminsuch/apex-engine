import { BrowserWindow } from 'electron';
import { join } from 'node:path';

import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';

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

    this.window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      if (!details.url.includes('index.html')) {
        callback(details);
        return;
      }

      if (!details.responseHeaders) {
        details.responseHeaders = {};
      }

      details.responseHeaders['Cross-Origin-Opener-Policy'] = ['same-origin'];
      details.responseHeaders['Cross-Origin-Embedder-Policy'] = ['require-corp'];

      callback({ responseHeaders: details.responseHeaders });
    });

    this.window.on('ready-to-show', () => {
      this.window?.show();
    });

    if (process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else if (IS_DEV) {
      this.window.loadURL(join(process.cwd(), 'node_modules/.apex/build/electron/index.html'));
    } else {
      this.window.loadURL(join(process.cwd(), 'build/electron/index.html'));
    }
  }
}
