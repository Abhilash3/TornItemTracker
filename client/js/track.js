import {account, prices, update} from './api';
import {itemSearch} from './search';
import {asDoller, asElement, asSearchItem, findAncestor} from './util';

import trackTemplate from '../template/track.html';

const MAX_HISTORY = 200;
const history = new Map();
const items = new Map();

function requestPermission(id, name) {
   Notification.requestPermission(permission => {
      if (permission === 'granted') notify(id, name, price);
   });
}

const openMarket = id => window.open('https://www.torn.com/imarket.php#/p=shop&step=shop&type=' + id);

let constraints = [{check: (id, max, value) => value / max < 0.95}];
let disabled = true;
function notify(id, name, price) {
    if (disabled) return;
    if (Notification.permission === 'default') requestPermission(id, name, price);
    if (Notification.permission === 'granted') {
        const notification = new Notification(
            `${name} at ${price}.`, {body: 'Click here to open market'});
        notification.onclick = () => {
            openMarket(id);
            notification.close();
        };
    }
}

function trackPrices(container) {
    Promise.all(Array.from(items).map(([name, id]) => prices([id], 1).then(([[[a]]]) => [name, a]))).then(prices => {
        const format = a => Number(a.toFixed(2));
        const checks = [[1000000000000, 't'], [1000000000, 'b'], [1000000, 'm'], [1000, 'k']];
        const label = num => {
            for (let [a, b] of checks) {
                if (num > a) return format(num / a) + b;
            }
            return num;
        };

        prices.forEach(([name, value]) => {
            const {values} = history.get(name);
            values.shift();
            values.push(value);

            const elem = container.querySelector(`#track-${items.get(name)} .card-body`);
            if (!elem) return;

            const max = values.filter(a => a).reduce((a, b) => Math.max(a, b), -1);
            const min = values.filter(a => a).reduce((a, b) => Math.min(a, b), max);
            const data = values.map(a => a ? format((a - min) * 100 / max) : '_');
            const limit = format(100 - min * 100 / max);

            const image = 'https://image-charts.com/chart?cht=ls&chs=600x100&chm=B,72BD60,0,0,0&chxt=y' +
                `&chxl=0:|${label(min)}|${label(max)}&chxr=0,0,${limit}&chd=t:${data.join(',')}`;
            elem.setAttribute('style', `background: url(${image}) no-repeat; background-size: 100% 100%;`);
            elem.classList.remove('flash');
            elem.innerHTML = `<strong>${name}: </strong>${value && asDoller(value) || '...'}`;

            if (!!value && constraints.some(({check}) => check(items.get(name), max, value))) {
                notify(items.get(name), name, asDoller(value));
                elem.classList.add('flash');
            }
        });

        const names = new Set(prices.map(([name]) => name));
        Array.from(history).filter(([name]) => !names.has(name)).forEach(([name, {values}]) => {
            values.shift();
            values.push(undefined);

            if (!values.some(a => a)) history.delete(name);
        });
    });
}

function startTrack(tab, {id, name}) {
    items.set(name, id);
    history.set(name, history.get(name) || {values: new Array(MAX_HISTORY).fill(undefined)});

    const elem = asElement(`
        <div id='track-${id}' data-name='${name}' data-id='${id}' class='card'>
            <div class='card-body'>
                <strong>${name}: </strong> ...
            </div>
        </div>`);
    tab.querySelector('#prices').appendChild(elem);
}

function stopTrack(tab, {id, name}) {
    items.delete(name);

    const elem = tab.querySelector('#prices #track-' + id);
    elem.parentNode.removeChild(elem);
}

export function init(parent) {
    const trackTab = parent.querySelector('#track');
    trackTab.appendChild(asElement(trackTemplate));

    account().then(({notify}) => {
        disabled = !notify;
        const checkbox = trackTab.querySelector('#notify');
        checkbox.checked = !!notify;
        checkbox.addEventListener('change', () => update({notify: disabled}).then(() => disabled = !disabled));
    });

    itemSearch(trackTab.querySelector('#item-search'), item => startTrack(trackTab, item), item => stopTrack(trackTab, item));

    const priceContainer = trackTab.querySelector('#prices');
    priceContainer.addEventListener('click', event => {
        const elem = findAncestor(event.target, '.card');
        if (!elem) return;
        event.preventDefault();

        openMarket(elem.dataset.id);
    });
    setInterval(() => trackPrices(priceContainer), 15 * 1000);
}
