import '../bootstrap';
import '../bootstrap-browser';

import { WindowMain } from './WindowMain';

((): void => {
  const sandbox = new WindowMain();
  sandbox.init();
})();
