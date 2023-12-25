import '../bootstrap';
import '../bootstrap-window';

import { WindowMain } from './WindowMain'; ;

(() => {
  const sandbox = new WindowMain();
  sandbox.init();
})();
