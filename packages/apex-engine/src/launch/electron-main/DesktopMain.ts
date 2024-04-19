import { BrowserWindow } from 'electron';

export class DesktopMain {
  private window?: BrowserWindow;

  constructor(args: string[]) {}

  public init(): void {
    // ? We have to keep in mind, that this window can be modified by the engine
    // ? during runtime (e.g. the user changes the game resolution).
    this.window = new BrowserWindow({
      autoHideMenuBar: true,
      // frame: false,
      height: 1080,
      width: 1920,
      show: false,
      title: 'Apex Engine | Electron',
      webPreferences: { enableWebSQL: false, sandbox: true, spellcheck: false },
    });

    this.window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      if (!details.url.includes('index.html')) {
        callback(details);
        return;
      }

      if (!details.responseHeaders) {
        details.responseHeaders = {};
      }

      // Required for SharedArrayBuffer
      details.responseHeaders['Cross-Origin-Opener-Policy'] = ['same-origin'];
      details.responseHeaders['Cross-Origin-Embedder-Policy'] = ['require-corp'];

      callback({ responseHeaders: details.responseHeaders });
    });

    this.window.on('ready-to-show', () => {
      this.window?.show();
    });

    this.window.loadURL(process.env['ELECTRON_RENDERER_URL'] as string);
  }
}
