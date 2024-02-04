import '../bootstrap';
import '../bootstrap-browser';

import { BrowserMain } from './BrowserMain';

((): void => {
  const browser = new BrowserMain();
  browser.init();
})();
