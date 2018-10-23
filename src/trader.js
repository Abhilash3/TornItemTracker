import { inventory, lowestItemPrice } from './api';
import { asElement, closest, toClipboard } from './util';

import plusMinusTemplate from '../template/plusMinus.html';
import traderTemplate from '../template/trader.html';

(function() {
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector;
    }
})();

function plusMinusElement(min = 0, max = 0, value = max) {
    var element = asElement(plusMinusTemplate);
    element.setAttribute('data-min', min);
    element.setAttribute('data-max', max);
    element.querySelector('input').value = value;

    return element;
}

function calculators(items, prices, userItems) {
    return items.map((item, n) => {
        var quantity = userItems.get(item.name) || 0;
        var element = asElement(`
            <tr id='calc-${item.id}' data-id='${item.id}' class='row item-calc'>
                <td class='col'>${item.name}</td>
                <td class='col price'>${prices[n]}</td>
                <td class='col'><input type='number' class='form-control' placeholder='0' /></td>
                <td class='col count'></td>
                <td class='col-3 value'>0</td>
            </tr>`);
        element.querySelector('.count').appendChild(plusMinusElement(0, quantity));

        return element;
    });
}

function triggerUpdate(event) {
    var tr = closest(event.target, 'tr');
    var inputs = tr.querySelectorAll('input');

    tr.querySelector('.value').innerHTML = Number(inputs[0].value) * Number(inputs[1].value);

    total.innerHTML = Array.prototype.reduce.call(tbody.querySelectorAll('.value'), (sum, elem) => {
        return sum + Number(elem.innerText);
    }, 0);
}

var tbody;
var total;
var itemNames;
var request;

export function init(parent) {
    var traderTab = parent.querySelector('#trader');
    traderTab.appendChild(asElement(traderTemplate));

    tbody = traderTab.querySelector('table#calc tbody');
    total = traderTab.querySelector('#total');

    tbody.addEventListener('keyup', triggerUpdate);
    tbody.addEventListener('click', event => {
        var target = event.target;
        if (target.nodeName.toLowerCase() === 'i') target = target.parentNode;
        if (target.nodeName.toLowerCase() !== 'button') return;

        event.preventDefault();
        var plusMinus = closest(target, 'div.plus-minus');

        var { min, max } = plusMinus.dataset;
        var input = plusMinus.querySelector('input');
        var value = Number(input.value);
        var type = target.dataset.type;

        input.readonly = false;
        if (type === '+') input.value = Math.min(max, value + 1);
        if (type === '-') input.value = Math.max(min, value - 1);
        input.readonly = true;

        triggerUpdate(event);
    });

    traderTab.querySelector('#copy').addEventListener('click', () => {
        var rows = tbody.querySelectorAll('tr.item-calc');
        var text = td => td.innerText;
        var value = td => Number(td.querySelector('input').value);

        var log = Array.prototype.reduce.call(rows, (acc, calc) => {
            var tds = calc.querySelectorAll('td');
            if ([tds[2], tds[3]].some(td => value(td) === 0)) return acc;

            return `${acc}\n${text(tds[0])} [lowest price: ${text(tds[1])}]:\n\t` +
                `${value(tds[2])} * ${value(tds[3])} = ${text(tds[4])}`;
        }, '');

        if (log !== '') toClipboard(`${log}\n\nTotal: ${text(total)}`);
    });
}

export function trade(items) {
    var names = items.map(item => item.name).sort().join();
    if (itemNames === names) return;
    itemNames = names;

    tbody.innerHTML = '';
    total.innerHTML = '0';
    if (request) clearInterval(request);

    if (!items.length) return;

    var userItems = inventory();
    var prices = Promise.all(items.map(item => lowestItemPrice(item.id)));

    (async function() {
        var elems = calculators(items, await prices, await userItems);
        elems.forEach(elem => tbody.appendChild(elem));

        request = setInterval(async () => {
            var prices = await Promise.all(elems.map(elem => lowestItemPrice(elem.dataset.id)));
            elems.forEach((elem, n) => elem.querySelector('.price').innerHTML = prices[n]);
        }, 15 * 1000);
    })();
}
