import { inventory, priceDetails } from '../api';
import { asElement, toClipboard } from '../util';

import plusMinusTemplate from '../../template/plusMinus.html';
import traderTemplate from '../../template/trader.html';

(function() {
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

function pricesToHtml(prices) {
    return prices.reduce((acc, a) => `${acc}<div class='m-auto p-1'><div>${a[0]}</div><div>${a[1]}</div></div>`, '');
}

function calculators(items, prices, userItems) {
    return items.map(({id, name}, n) => {
        const quantity = userItems.get(name) || 0;
        const element = asElement(`
            <tr data-id='${id}' class='row item-calc'>
                <td class='col m-auto name'><label class='col-form-label'>${name}</label></td>
                <td class='col m-auto price d-flex flex-wrap'>${pricesToHtml(prices[n])}</td>
                <td class='col m-auto'><input type='number' class='form-control' placeholder='0' /></td>
                <td class='col m-auto inventory'><label class='col-form-label'>${quantity}</label></td>
                <td class='col m-auto count'></td>
                <td class='col m-auto'><label class='col-form-label value'>0</label></td>
            </tr>`);
        element.querySelector('.count').appendChild(plusMinusElement(0, quantity));
        count.innerHTML = Number(count.innerHTML) + quantity;

        return element;
    });
}

function plusMinusElement(min = 0, max = 0, value = max) {
    const element = asElement(plusMinusTemplate);
    element.setAttribute('data-min', min);
    element.setAttribute('data-max', max);
    element.querySelector('input').value = value;

    return element;
}

function triggerUpdate({target}) {
    const tr = closest(target, 'tr');
    const [{value: price}, {value: count}] = tr.querySelectorAll('input');

    tr.querySelector('.value').innerHTML = Number(price) * Number(count);

    total.innerHTML = Array.prototype.reduce.call(
        tbody.querySelectorAll('.value'), (sum, elem) => sum + Number(elem.innerText), 0);
}

var tbody;
var count;
var total;
var itemNames;

export function init(parent) {
    const traderTab = parent.querySelector('#trader');
    traderTab.appendChild(asElement(traderTemplate));

    tbody = traderTab.querySelector('table#calc tbody');
    count = traderTab.querySelector('#count');
    total = traderTab.querySelector('#total');

    tbody.addEventListener('keyup', triggerUpdate);
    tbody.addEventListener('click', event => {
        let target = event.target;
        if (target.nodeName.toLowerCase() === 'i') target = target.parentNode;
        if (target.nodeName.toLowerCase() !== 'button') return;
        event.preventDefault();

        const plusMinus = closest(target, 'div.plus-minus');

        const { min, max } = plusMinus.dataset;
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

        rows.forEach((row, n) => row.querySelector('.price').innerHTML = pricesToHtml(prices[n]));
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
        const rows = tbody.querySelectorAll('tr.item-calc');
        const text = td => td.innerText;
        const value = td => Number(td.querySelector('input').value);

        const log = Array.prototype.reduce.call(rows, (acc, calc) => {
            const tds = calc.querySelectorAll('td');
            if (tds.length < 6 || text(tds[5]) == 0) return acc;

            return `${acc}${text(tds[0])} ${value(tds[2])} * ${value(tds[4])} = ${text(tds[5])}\n`;
        }, '');

        if (log !== '') toClipboard(`${log}\nTotal: ${text(total)}`);
    });
}

export function trade(items) {
    const names = items.map(item => item.name).sort().join();
    if (itemNames === names) return;
    itemNames = names;

    tbody.innerHTML = '';
    total.innerHTML = '0';
    count.innerHTML = '0';

    if (!items.length) return;

    const prices = Promise.all(items.map(({id}) => priceDetails(id)));
    const userItems = inventory();

    (async () => calculators(items, await prices, await userItems).forEach(elem => tbody.appendChild(elem)))();
}
