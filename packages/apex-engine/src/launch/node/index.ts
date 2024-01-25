import '../bootstrap';
import '../bootstrap-node';

import { CliMain } from './CliMain';

((): void => {
  const cli = new CliMain();
  cli.init();
})();
