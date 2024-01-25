import '../bootstrap';
import '../bootstrap-window';

import { WindowMain } from './WindowMain';

((): void => {
  const sandbox = new WindowMain();
  sandbox.init();
})();
