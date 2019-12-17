import * as search from './tab/search';
import * as tracker from './tab/tracker';
import * as trader from './tab/trader';
import { asElement } from './util';

import mainTemplate from '../template/main.html';

export function init(parent) {
    const main = parent.querySelector('#main');
    main.appendChild(asElement(mainTemplate));

    const tabs = main.querySelectorAll('div.tab');
    main.querySelector('ul.nav').addEventListener('click', event => {
        const tabId = event.target.getAttribute('href');
        if (!tabId) return;

        event.preventDefault();
        tabs.forEach(tab => {
            if (`#${tab.getAttribute('id')}` === tabId) {
                tab.classList.remove('hide');
                tab.classList.add('active');
            } else {
                tab.classList.add('hide');
                tab.classList.remove('active');
            }
        });
    });

    main.querySelector('#track-tab').addEventListener('click', async () => tracker.track(await search.selected()));
    main.querySelector('#trade-tab').addEventListener('click', async () => trader.trade(await search.selected()));

    [search, tracker, trader].forEach(a => a.init(main));

    main.querySelector('ul.nav li a.nav-link.active').click();
}
