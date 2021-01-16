import {account, prices, update} from './api';
import {itemSearch} from './search';
import {asDoller, asElement, asSearchItem, findAncestor, randomColor} from './util';

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

    const max = values => values.filter(a => a).reduce((a, b) => Math.max(a, b), -1);
    const chartData = data => {
        const maxValue = max(data), minValue = data.filter(a => a).reduce((a, b) => Math.min(a, b), maxValue);
        const expected = maxValue + minValue;
        return data.map(a => a && (a * 100 / expected).toFixed(0) || '_');
    };
    const values = Array.from(items);
    prices(values.map(([, id]) => id), 1).then(a => a.map(([[b]], i) => [values[i][0], b])).then(prices => {
        container.innerHTML = '';
        const priceMap = new Map(prices);

        values.forEach(([name]) => {
            const {color, values: data} = history.get(name);
            const value = priceMap.get(name);
            data.shift();
            data.push(value);

            const image = 'https://image-charts.com/chart?cht=ls&chs=600x100&chm=B,' + color.slice(1) +
                ',0,0,0&chxr=0,1,100&chd=t:' + chartData(data).join(',');
            const style = 'background: url(' + image + ') no-repeat; background-size: 100% 100%;';
            container.appendChild(asElement(`
                <div data-name='${name}' class='tracker card'>
                    <div class='card-body' style='${style}'>
                        <strong>${name}: </strong>${asDoller(value)}
                    </div>
                </div>`));

            if (constraints.some(({check}) => check(items.get(name), 1 - value / max(data)))) {
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
    history.set(name, history.get(name) || {values: new Array(MAX_HISTORY).fill(undefined), color: randomColor()});
}

function stopTrack(tab, id, name) {
    items.delete(name);
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
    priceContainer.addEventListener('click', ({target}) => {
        const tracker = findAncestor(target, '.tracker');
        if (!tracker) return;

        const log = history.get(tracker.dataset.name);
        if (log) log.color = randomColor();
    });
    setInterval(() => trackPrices(priceContainer), 15 * 1000);
}
