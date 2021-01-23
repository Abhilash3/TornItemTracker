import * as account from './account';
import * as museum from './museum';
import * as track from './track';
import * as trade from './trade';
import {user} from './api';
import {asElement} from './util';

import mainTemplate from '../template/main.html';

export function init(parent) {
    const main = parent.querySelector('#main');
    main.appendChild(asElement(mainTemplate));

    const dark = main.querySelector('#dark');
    const light = main.querySelector('#light');

    light.addEventListener('click', () => {
        light.classList.add('hide');
        dark.classList.remove('hide');
        parent.classList.remove('dark');
    });

    dark.addEventListener('click', () => {
        dark.classList.add('hide');
        light.classList.remove('hide');
        parent.classList.add('dark');
    });

    user().then(a => main.querySelector('#name').innerHTML = a.username);

    [account, track, trade, museum].forEach(a => a.init(main));
    light.click();
}
