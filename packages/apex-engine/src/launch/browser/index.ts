import '../bootstrap';
import '../bootstrap-window';

import { BrowserMain } from './BrowserMain';

(() => {
  const browser = new BrowserMain();
  browser.init();
})();
