import {prices} from './api';
import {parseQuery} from './query';
import {inventoryRefresh, inventorySearch} from './search';
import {asDoller, asElement, findAncestor, toClipboard, toMap} from './util';

import counterTemplate from '../template/counter.html';
import progressTemplate from '../template/progress.html';
import tradeTemplate from '../template/trade.html';
import tradeRowTemplate from '../template/tradeRow.html';

(() => {
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector;
    }
})();

const asHtml = (() => {
    const templated = (price, count) => `<div class='m-auto p-1'><div>${asDoller(price)}</div><div>${count}</div></div>`;
    return prices => prices.map(([a, b]) => templated(Number(a), b)).reduce((a, b) => a + b, '');
})();

function createCounter(min = 0, max = 0, value = max) {
    const element = asElement(counterTemplate);
    element.setAttribute('data-min', min);
    element.setAttribute('data-max', max);
    element.querySelector('input').value = value;

    return element;
}

let tbody;
let count;
let total;

function asTradeRow({id, name}, count) {
    const element = asElement(tradeRowTemplate);
    element.setAttribute('data-id', id);
    element.querySelector('.name').innerHTML = name;
    element.querySelector('.inventory').innerHTML = count;
    element.querySelector('.count').appendChild(createCounter(0, count));

    element.querySelector('.price').innerHTML = progressTemplate;
    prices([id]).then(([a]) => element.querySelector('.price').innerHTML = asHtml(a));

    return element;
}

export function init(parent) {
    const tradeTab = parent.querySelector('#trade');
    tradeTab.appendChild(asElement(tradeTemplate));

    tbody = tradeTab.querySelector('table#calc tbody');
    total = tradeTab.querySelector('#total');

    const triggerUpdate = ({target}) => {
        const value = Array.prototype.reduce.call(tbody.querySelectorAll('tr'), (sum, tr) => {
            const [{value: price}, {value: count}] = tr.querySelectorAll('input');
            return sum + Number(price) * Number(count);
        }, 0);
        total.innerHTML = asDoller(value);
    };

    tbody.addEventListener('keyup', triggerUpdate);
    tbody.addEventListener('click', event => {
        let target = event.target;
        if (target.nodeName.toLowerCase() === 'i') target = target.parentNode;
        if (target.nodeName.toLowerCase() !== 'button') return;
        if (findAncestor(target, 'div.plus-minus') === null) return;
        event.preventDefault();

        const plusMinus = findAncestor(target, 'div.plus-minus');

        const {min, max} = plusMinus.dataset;
        const input = plusMinus.querySelector('input');
        const value = Number(input.value);
        const type = target.dataset.type;

        input.readonly = false;
        if (type === '+') input.value = Math.min(max, value + 1);
        if (type === '-') input.value = Math.max(min, value - 1);
        input.readonly = true;

        triggerUpdate(event);
    });

    const unSelect = inventorySearch(
        tradeTab.querySelector('#search-inventory'),
        tradeTab.querySelector('#search-list'),
        (item, value) => tbody.appendChild(asTradeRow(item, value)));

    tbody.addEventListener('click', event => {
        let target = event.target;
        if (findAncestor(target, 'td.info') === null) return;
        event.preventDefault();

        const row = findAncestor(target, 'tr.item-calc');
        const {id} = row.dataset;
        row.parentNode.removeChild(row);

        unSelect(id);
    });

    tradeTab.querySelector('#price-refresh').addEventListener('click', () => {
        const rows = tbody.querySelectorAll('tr.item-calc');
        rows.forEach((row, n) => row.querySelector('.price').innerHTML = progressTemplate);

        const request = prices(Array.prototype.map.call(rows, row => row.dataset.id));
        rows.forEach(async (row, n) => {
            const prices = await request;
            row.querySelector('.price').innerHTML = asHtml(prices[n]);
        });
    });

    tradeTab.querySelector('#inventory-refresh').addEventListener('click', () => {
        const rows = tbody.querySelectorAll('tr.item-calc');
        rows.forEach(row => row.querySelector('.inventory').innerHTML = progressTemplate);
        const request = inventoryRefresh();
        rows.forEach(async row => {
            const userItems = await request;
            const name = row.querySelector('td.name label').innerText;
            const count = userItems.get(name) || 0;

            row.querySelector('.count div.plus-minus').setAttribute('data-max', count);
            row.querySelector('.inventory').innerHTML = count;
        });
    });

    tradeTab.querySelector('#trade-copy').addEventListener('click', () => {
        const log = Array.prototype.reduce.call(tbody.querySelectorAll('tr.item-calc'), (acc, calc) => {
            const label = calc.querySelector('.name').innerHTML;
            const [{value: price}, {value: count}] = calc.querySelectorAll('input');
            if (!Number(price) || !Number(count)) return acc;

            return `${acc}${label} ${asDoller(Number(price))} * ${Number(count)} = ${asDoller(Number(price) * Number(count))}\n`;
        }, '');

        if (log !== '') toClipboard(`${log}\nTotal: ${total.innerHTML}`);
    });
}
