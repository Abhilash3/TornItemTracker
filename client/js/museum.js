import {exchanges, exchange, inventory, items} from './api';
import {asDoller, asElement, toMap} from './util';

import exchangeSetTemplate from '../template/exchangeSet.html';
import museumTemplate from '../template/museum.html';
import progressTemplate from '../template/progress.html';

const itemMap = items().then(a => toMap(a, b => Number(b.id)));
const exchangeSets = exchanges().then(arr => toMap(arr, a => a.type));

export function init(parent) {
    const museumTab = parent.querySelector('#museum');
    museumTab.appendChild(asElement(museumTemplate));

    const container = museumTab.querySelector('#exchanges');

    exchangeSets.then(map => Array.from(map).forEach(([name, {items, points}]) => {
        const elem = asElement(exchangeSetTemplate);
        const count = items.map(({count: a}) => a || 1).reduce((a, b) => a + b, 0);
        elem.querySelector('.name').innerHTML = name[0].toUpperCase() + name.slice(1) + ' Set';
        elem.querySelector('.label').innerHTML = `${count} item${count === 1 ? '' : 's'} for ${points} points`;

        container.appendChild(elem);

        const minElem = elem.querySelector('.min');
        const profitElem = elem.querySelector('.profit');
        elem.querySelector('button').addEventListener('click', async event => {
            event.preventDefault();
            minElem.innerHTML = profitElem.innerHTML = progressTemplate;

            const {profit, min} = await exchange(name);
            minElem.innerHTML = asDoller(min);
            profitElem.innerHTML = asDoller(profit);
        });
    }));
}
