import {inventory, prices} from './api';
import {asDoller, asElement, toClipboard, toMap} from './util';

import counterTemplate from '../template/counter.html';
import tradeRowTemplate from '../template/tradeRow.html';
import traderTemplate from '../template/trader.html';

(() => {
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector;
    }
})();

function closest(element, selector) {
    while (element !== null && !element.matches(selector)) {
        element = element.parentNode;
    }
    return element;
}

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

function createTradeRow({id, name}) {
    const element = asElement(tradeRowTemplate);
    element.setAttribute('data-id', id);
    element.querySelector('td.name > label').innerHTML = name;
    element.querySelector('td.value > label').innerHTML = 0;

    return element;
}

let tbody;
let count;
let total;

export function init(parent) {
    const traderTab = parent.querySelector('#trader');
    traderTab.appendChild(asElement(traderTemplate));

    tbody = traderTab.querySelector('table#calc tbody');
    count = traderTab.querySelector('#count');
    total = traderTab.querySelector('#total');

    const triggerUpdate = ({target}) => {
        const tr = closest(target, 'tr');
        const [{value: price}, {value: count}] = tr.querySelectorAll('input');

        tr.querySelector('td.value > label').innerHTML = Number(price) * Number(count);

        total.innerHTML = Array.prototype.reduce.call(
            tbody.querySelectorAll('td.value > label'), (sum, elem) => sum + Number(elem.innerText), 0);
    };

    tbody.addEventListener('keyup', triggerUpdate);
    tbody.addEventListener('click', event => {
        let target = event.target;
        if (target.nodeName.toLowerCase() === 'i') target = target.parentNode;
        if (target.nodeName.toLowerCase() !== 'button') return;
        event.preventDefault();

        const plusMinus = closest(target, 'div.plus-minus');

        const {min, max} = plusMinus.dataset;
        const input = plusMinus.querySelector('input');
        const value = Number(input.value);
        const type = target.dataset.type;

        input.readonly = false;
        if (type === '+') input.value = Math.min(max, value + 1);
        if (type === '-') input.value = Math.max(min, value - 1);
        input.readonly = true;

        count.innerHTML = Number(count.innerHTML) - value + Number(input.value);

        triggerUpdate(event);
    });

    traderTab.querySelector('#price-refresh').addEventListener('click', async () => {
        const rows = tbody.querySelectorAll('tr.item-calc');
        const prices = await Promise.all(Array.prototype.map.call(rows, row => priceDetails(row.dataset.id)));

        rows.forEach((row, n) => row.querySelector('.price').innerHTML = asHtml(prices[n]));
    });

    traderTab.querySelector('#inventory-refresh').addEventListener('click', async () => {
        const userItems = await inventory();
        tbody.querySelectorAll('tr.item-calc').forEach(row => {
            const name = row.querySelector('td.name label').innerText;
            const count = userItems.get(name) || 0;

            row.querySelector('td.count div.plus-minus').setAttribute('data-max', count);
            row.querySelector('td.inventory label').innerHTML = count;
        });
    });

    traderTab.querySelector('#trade-copy').addEventListener('click', () => {
        const text = td => td.innerText;
        const value = td => Number(td.querySelector('input').value);

        const log = Array.prototype.reduce.call(tbody.querySelectorAll('tr.item-calc'), (acc, calc) => {
            const [label, , price, , count, total] = calc.querySelectorAll('td');
            if (!total || !Number(text(total))) return acc;

            return `${acc}${text(label)} ${value(price)} * ${value(count)} = ${text(total)}\n`;
        }, '');

        if (log !== '') toClipboard(`${log}\nTotal: ${text(total)}`);
    });
}

export function trade(items) {
    const itemMap = toMap(items, a => a.name);
    let countValue = Number(count.innerHTML), totalValue = Number(total.innerHTML);
    Array.prototype.forEach.call(tbody.querySelectorAll('tr'), tr => {
        if (!itemMap.has(tr.querySelector('td.name > label').innerHTML)) {
            countValue -= Number(tr.querySelector('td.inventory > label').innerHTML);
            totalValue -= Number(tr.querySelector('td.value > label').innerHTML);
            tbody.removeChild(tr);
        }
    });
    total.innerHTML = totalValue;
    count.innerHTML = countValue;

    items.filter(({id}) => !tbody.querySelector(`tr[data-id='${id}']`)).forEach(item => tbody.appendChild(createTradeRow(item)));

    const pricesRequest = Promise.all(items.map(({id, name}) => prices(id).then(prices => [name, prices]))).then(prices => new Map(prices));
    Promise.all([pricesRequest, inventory()]).then(([prices, inventory]) => {
        Array.prototype.forEach.call(tbody.querySelectorAll('tr'), tr => {
            const name = tr.querySelector('td.name > label').innerHTML;
            const quantity = inventory.get(name) || 0;

            tr.querySelector('td.price').innerHTML = asHtml(prices.get(name) || []);
            tr.querySelector('td.inventory > label').innerHTML = quantity;

            const counter = tr.querySelector('td.count');
            if (counter.querySelector('.plus-minus') == null) {
                counter.appendChild(createCounter(0, quantity));
                countValue += quantity;
            }
        });
        count.innerHTML = countValue;
    });
}
