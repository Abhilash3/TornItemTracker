import { inventory, lowestItemPrice } from './api';
import { asElement, toClipboard} from './util';

import traderTemplate from '../template/trader.html';

function calculators(items, prices, userItems) {
    return items.map((item, n) => {
        var quantity = userItems.get(item.name) || 0;
        return asElement(`
            <tr id='calc-${item.id}' data-id='${item.id}' class='row item-calc'>
                <td class='col'>${item.name}</td>
                <td class='col price'>${prices[n]}</td>
                <td class='col'><input type='number' class='form-control' placeholder='0' /></td>
                <td class='col count'>${quantity}</td>
                <td class='col-3 value'>0</td>
            </tr>`);
    });
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

    traderTab.addEventListener('keyup', event => {
        var tr = event.target.parentNode.parentNode;
        var count = tr.querySelector('.count').innerHTML;
        var price = tr.querySelector('input').value;

        tr.querySelector('.value').innerHTML = Number(price) * Number(count);

        total.innerHTML = Array.prototype.reduce.call(traderTab.querySelectorAll('.value'), (sum, elem) => {
            return sum + Number(elem.innerHTML);
        }, 0);
    });

    traderTab.querySelector('#copy').addEventListener('click', () => {
        var rows = tbody.querySelectorAll('tr.item-calc');
        if (!rows.length) return;

        var log = Array.prototype.reduce.call(rows, (acc, calc) => {
            var tds = calc.querySelectorAll('td');
            return `${acc}\n${tds[0].innerHTML} [lowest price: ${tds[1].innerHTML}]:\n\t` +
                `${tds[2].children[0].value || 0} * ${tds[3].innerHTML} = ${tds[4].innerHTML}`;
        }, '');

        toClipboard(`${log}\n\nTotal: ${total.innerHTML}`);
    });
}

export function trade(items) {
    var names = items.map(item => item.name).sort().join();
    if (itemNames === names) return;

    itemNames = names;

    tbody.innerHTML = '';
    total.innerHTML = '0';
    if (request) clearInterval(request);

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
