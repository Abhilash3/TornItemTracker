import {asElement} from './util.js';

import accountTemplate from '../template/account.html';

export function init(parent) {
  const accountTab = parent.querySelector('#account');
  accountTab.appendChild(asElement(accountTemplate));
}
