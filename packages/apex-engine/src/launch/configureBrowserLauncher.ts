import { log } from '../core/logging';

export function configureBrowserLauncher(main: Function) {
  log('LauncherConfiguration', 'log', 'Configuring browser launcher');

  return () => {
    main();
  };
}
