import {details, update} from './api';
import {asElement} from './util';

import accountTemplate from '../template/account.html';

export function init(parent) {
    const accountTab = parent.querySelector('#account');
    accountTab.appendChild(asElement(accountTemplate));

    details().then(console.log);
}
