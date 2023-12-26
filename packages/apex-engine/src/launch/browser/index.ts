import '../bootstrap';
import '../bootstrap-window';

import { BrowserMain } from './BrowserMain'; ;

((): void => {
  const browser = new BrowserMain();
  browser.init();
})();
