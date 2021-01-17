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

let constraints = [{check: (id, rate) => rate > 0.05}];
let disabled = true;
function notify(id, name, price) {
    if (disabled) return;
    if (Notification.permission === 'default') requestPermission(id, name, price);
    if (Notification.permission === 'granted') {
        const notification = new Notification(
            `${name} at ${price}.`, {body: 'Click here to open market'});
        notification.onclick = () => {
            window.open('https://www.torn.com/imarket.php#/p=shop&step=shop&type=' + id);
            notification.close();
        };
    }
}

function trackPrices(container) {
    if (!items.size) return;

    const values = Array.from(items);
    Promise.all(values.map(([, id]) => prices([id], 1))).then(a => a.map(([[[b]]], i) => [values[i][0], b])).then(prices => {
        const priceMap = new Map(prices);
        const format = a => Number(a.toFixed(2));

        values.forEach(([name]) => {
            const {values} = history.get(name);
            const value = priceMap.get(name);
            values.shift();
            values.push(value);

            const max = values.filter(a => a).reduce((a, b) => Math.max(a, b), -1);
            const min = values.filter(a => a).reduce((a, b) => Math.min(a, b), max);
            const data = values.map(a => a ? format((a - min) * 100 / max) : '_');
            const limit = format(100 - min * 100 / max);

            const image = `https://image-charts.com/chart?cht=ls&chs=600x100&chm=B,72BD60,0,0,0&chxr=0,0,${limit}&chd=t:${data.join(',')}`;
            const style = 'background: url(' + image + ') no-repeat; background-size: 100% 100%;';
            const elem = container.querySelector(`#track-${items.get(name)} .card-body`);
            elem.setAttribute('style', style);
            elem.innerHTML = `<strong>${name}: </strong>${value && asDoller(value) || '...'}`;

            if (!!value && constraints.some(({check}) => check(items.get(name), 1 - value / max))) {
                notify(items.get(name), name, asDoller(value));
            }
        });

        Array.from(history).filter(([name]) => !items.has(name)).forEach(([name, {values}]) => {
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
        <div id='track-${id}' data-name='${name}' class='card'>
            <div class='card-body'>
                <strong>${name}: </strong> ...
            </div>
        </div>`);
    tab.querySelector('#prices').appendChild(elem);
}

function stopTrack(tab, id, name) {
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

    const selected = trackTab.querySelector('#selected');
    const unSelect = itemSearch(
        trackTab.querySelector('#search-item'),
        trackTab.querySelector('#search-result'),
        item => {
            selected.appendChild(asSearchItem(item.id, item.name));
            startTrack(trackTab, item);
        });

    selected.addEventListener('click', event => {
        if (!event.target.classList.contains('item')) return;
        event.preventDefault();

        event.target.parentNode.removeChild(event.target);
        const {id, name} = event.target.dataset;
        stopTrack(trackTab, id, name);
        unSelect(id);
    });

    const priceContainer = trackTab.querySelector('#prices');
    setInterval(() => trackPrices(priceContainer), 15 * 1000);
}
