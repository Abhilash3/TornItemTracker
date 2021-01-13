import * as museum from './museum';
import * as search from './search';
import * as tracker from './tracker';
import * as trader from './trader';
import {asElement} from './util';

import mainTemplate from '../template/main.html';

export function init(parent) {
    const main = parent.querySelector('#main');
    main.appendChild(asElement(mainTemplate));

    const tabs = main.querySelectorAll('div.tab');
    main.querySelector('ul.navbar-nav').addEventListener('click', event => {
        const tabId = event.target.getAttribute('href');
        if (!tabId) return;

        event.preventDefault();
        tabs.forEach(tab => {
            if ('#' + tab.getAttribute('id') === tabId) {
                tab.classList.remove('hide');
                tab.classList.add('active');
            } else {
                tab.classList.add('hide');
                tab.classList.remove('active');
            }
        });
    });

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

    main.querySelector('#track-tab').addEventListener('click', async () => tracker.track(await search.selected()));
    main.querySelector('#trade-tab').addEventListener('click', async () => trader.trade(await search.selected()));

    [search, tracker, trader, museum].forEach(a => a.init(main));

    main.querySelector('ul.navbar-nav li.nav-item.active a.nav-link').click();
    light.click();
}
