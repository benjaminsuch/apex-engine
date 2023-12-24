import '../bootstrap';
import '../bootstrap-window';

import { plugins } from 'build:info';

import { BrowserMain } from './BrowserMain'; ;

(() => {
  console.log(plugins);
  const browser = new BrowserMain();
  browser.init();
})();
