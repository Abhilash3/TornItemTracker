import {delayedPrices, inventory, items, prices} from './api';
import {asDoller, asElement, toMap} from './util';

import museumTemplate from '../template/museum.html';

const itemMap = items().then(a => toMap(a, b => Number(b.id)));

const exchangeSets = new Map([
    ['plushie', {
        items: [186, 187, 215, 258, 261, 266, 268, 269, 273, 274, 281, 384, 618], points: 10,
    }], ['flower', {
        items: [260, 264, 282, 277, 276, 271, 272, 263, 267, 385, 617], points: 10,
    }], ['coin', {
        items: [450, 451, 452], points: 100,
    }], ['buddha', {
        items: [454], points: 100,
    }], ['ganesha', {
        items: [453], points: 250,
    }], ['shabti', {
        items: [458], points: 500,
    }], ['script', {
        items: [455, 456, 457], points: 1000,
    }], ['game', {
        items: [462, 460, 461], points: 2000,
    }], ['amulet', {
        items: [459], points: 10000,
    }],
]);
export function init(parent) {
    const museumTab = parent.querySelector('#museum');
    museumTab.appendChild(asElement(museumTemplate));

    const progress = () => asElement(`
        <div class='spinner-border spinner-border-sm' role='status'>
            <span class='sr-only'>Loading...</span>
        </div>`);
    const pointPrices = prices(0, 1);
    const tbody = museumTab.querySelector('table tbody');

    museumTab.querySelector('table thead #item-refresh').addEventListener('click', () => {
        const request = inventory();
        const rows = Array.prototype.map.call(tbody.querySelectorAll('tr'), a => a);
        rows.forEach(row => {
            const count = row.querySelector('.count');
            count.innerHTML = '';
            count.appendChild(progress());
        });
        rows.forEach(async row => {
            const items = await itemMap;
            const inventory = await request;
            row.querySelector('.count').innerHTML = exchangeSets.get(row.dataset.type).items
                .map(a => inventory.get(items.get(a).name) || 0).reduce((a, b) => a > b ? b : a);
        });
    });
    Array.from(exchangeSets).forEach(([name, {items, points}]) => {
        const row = asElement(`
            <tr class='row' data-type='${name}'>
                <td class='col'>${name[0].toUpperCase() + name.slice(1)} Set</td>
                <td class='col'>${items.length}</td>
                <td class='col'>${points}</td>
                <td class='col count'></td>
                <td class='col profit'></td>
            </tr>`);
        tbody.appendChild(row);

        const count = row.querySelector('.count');
        const profit = row.querySelector('.profit');
        row.addEventListener('click', async () => {
            profit.innerHTML = '';
            profit.appendChild(progress());

            const [pointPrice, ...itemPrices] = await Promise.all([0, ...items].map((a, i) => delayedPrices(i, a, 1).then(([[a]]) => a)));
            const cost = itemPrices.reduce((acc, a) => acc + a);
            profit.innerHTML = asDoller(points * pointPrice - cost);
        });
    });

    museumTab.querySelector('table thead #item-refresh').click();
}
