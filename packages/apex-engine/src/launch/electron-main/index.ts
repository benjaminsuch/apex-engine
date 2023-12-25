import '../bootstrap';
import '../bootstrap-electron';

import { app, Menu } from 'electron';

import { DesktopMain } from './DesktopMain';

// Disable default menu (https://github.com/electron/electron/issues/35512)
Menu.setApplicationMenu(null);

/**
 * Receives and processes CLI arguments that target the engine.
 *
 * @param args CLI arguments for the engine (not to be confused with arguments of our build-scripts).
 */
export async function main(args: string[]) {
  app.whenReady().then(() => {
    const desktop = new DesktopMain(args);
    desktop.init();
  });

  app.on('browser-window-created', (_, window) => {
    window.webContents.openDevTools();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

main(process.argv);
