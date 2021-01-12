import {delayedPrices, exchanges, inventory, items, prices} from './api';
import {asDoller, asElement, toMap} from './util';

import progressTemplate from '../template/progress.html';
import museumTemplate from '../template/museum.html';

const itemMap = items().then(a => toMap(a, b => Number(b.id)));
const exchangeSets = exchanges().then(arr => toMap(arr, a => a.type));

export function init(parent) {
    const museumTab = parent.querySelector('#museum');
    museumTab.appendChild(asElement(museumTemplate));

    const tbody = museumTab.querySelector('table tbody');

    const rows = [];
    exchangeSets.then(map => Array.from(map).forEach(([name, {items, points}]) => {
        const row = asElement(`
            <tr class='row' data-type='${name}'>
                <td class='col'>${name[0].toUpperCase() + name.slice(1)} Set</td>
                <td class='col'>${items.length}</td>
                <td class='col'>${points}</td>
                <td class='col count'></td>
                <td class='col min'></td>
                <td class='col profit'></td>
            </tr>`);
        tbody.appendChild(row);
        rows.push(row);

        const count = row.querySelector('.count');
        const min = row.querySelector('.min');
        const profit = row.querySelector('.profit');
        row.addEventListener('click', async () => {
            min.innerHTML = profit.innerHTML = progressTemplate;

            const [pointPrice, ...itemPrices] = await Promise.all([0, ...items].map((a, i) => delayedPrices(i, a, 1).then(([[a]]) => a)));
            const cost = itemPrices.reduce((acc, a) => acc + a);
            min.innerHTML = asDoller(cost / points);
            profit.innerHTML = asDoller(points * pointPrice - cost);
        });
    }));

    museumTab.querySelector('table thead #item-refresh').addEventListener('click', () => {
        const request = inventory();
        rows.forEach(row => row.querySelector('.count').innerHTML = progressTemplate);
        rows.forEach(async row => {
            const items = await itemMap;
            const inventory = await request;
            const sets = await exchangeSets;
            row.querySelector('.count').innerHTML = sets.get(row.dataset.type).items
                .map(a => inventory.get(items.get(a).name) || 0).reduce((a, b) => a > b ? b : a);
        });
    });

    museumTab.querySelector('table thead #item-refresh').click();
}
