import {account, prices, update} from './api';
import {itemSearch} from './search';
import {asDoller, asElement, asSearchItem, randomColor} from './util';
import Chart from 'chart.js';

import trackTemplate from '../template/track.html';

const MAX_HISTORY = 1000;
const history = new Map();
const items = new Map();

function requestPermission(id, name) {
   Notification.requestPermission(permission => {
      if (permission === 'granted') notify(id, name, price);
   });
}

let constraints = [];
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

let request;
let chart;

function updateDatasets(process = () => true) {
    chart.data.datasets = Array.from(history)
        .filter(([name, log]) => process(name, log))
        .map(([name, {color, values}]) => ({
            borderColor: color, borderWidth: 2, data: values, fill: false,label: name,
            pointBackgroundColor: color, pointBorderColor: color, pointBorderWidth: 5,
            pointHoverBackgroundColor: color, pointHoverBorderColor: color,
            pointHoverBorderWidth: 1, pointHoverRadius: 5, pointRadius: 0,
        }));
    chart.update();
}

function trackPrices() {
    if (!chart || !items.size) return;

    const max = values => values.reduce((a, b) => Math.max(a, b), -1);
    const values = Array.from(items);
    prices(values.map(([, id]) => id), 1).then(a => a.map(([[b]], i) => [values[i][0], b])).then(prices => {
        const priceMap = new Map(prices);
        updateDatasets((name, {values}) => {
            const value = priceMap.get(name);
            values.shift();
            values.push(value);

            const isValid = values.some(a => a);
            if (!isValid) history.delete(name);

            if ((value || value === 0) && constraints.some(({check}) => check(items.get(name), value / max(values)))) {
                notify(items.get(name), name, asDoller(value));
            }

            return isValid;
        });
    });
}

function startTrack(tab, {id, name}) {
    items.set(name, id);
    history.set(name, history.get(name) || {values: new Array(MAX_HISTORY), color: randomColor()});

    const constraint = constraints.find(a => a.id === id);
    if (constraint && false) {
        tab.querySelector('#constraints').appendChild(asElement(`
            <div id='item-${id}' class='input-group'>
                <div class='form-control'>${name}</div>
                <div class='input-group-append'>
                    <span class='form-control'>${constraint.value * 100}%</span>
                </div>
            </div>`));
    }
}

function stopTrack(tab, id) {
    items.delete(id);
    const elem = tab.querySelector('#constraints #item-' + id);
    if (elem && false) {
        elem.parentNode.removeChild(elem);
    }
}

export function init(parent) {
    const trackTab = parent.querySelector('#track');
    trackTab.appendChild(asElement(trackTemplate));

    account().then(({notify, trackers = [{id: -1, value: 0.05}]}) => {
        disabled = !notify;
        const checkbox = trackTab.querySelector('#notify');
        checkbox.checked = !!notify;
        checkbox.addEventListener('change', () => update({notify: disabled}).then(() => disabled = !disabled));

        constraints = trackers.map((item) => {
            const {id, value} = item;
            const copy = Object.create(item);
            if (id === -1) copy.check = (item, rate) => rate <= (1 - value);
            else copy.check = (item, rate) => Number(item) === id && rate <= (1 - value);
            return copy;
        });
    });

    const updateAxesColor = (key, color) => {
        const {gridLines, ticks} = chart.options.scales[key + 'Axes'][0];
        gridLines.zeroLineColor = color;
        ticks.fontColor = color;
        chart.update();
    };
    trackTab.querySelector('#xColor').addEventListener('click', () => updateAxesColor('x', randomColor()));
    trackTab.querySelector('#yColor').addEventListener('click', () => updateAxesColor('y', randomColor()));

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
        const {id} = event.target.dataset;
        stopTrack(trackTab, id);
        unSelect(id);
    });

    const xColor = randomColor(), yColor = randomColor();
    chart = new Chart(trackTab.querySelector('canvas.chart').getContext('2d'), {
        data: {
            datasets: [],
            labels: new Array(MAX_HISTORY).fill(0).map((a, b) => MAX_HISTORY - b),
        },
        options: {
            animation: {duration: 0},
            elements: {line: {tension: 0}},
            legend: {
                onClick: (e, {text}) => {
                    const log = history.get(text);
                    if (log) {
                      log.color = randomColor();
                      updateDatasets();
                    }
                },
                position: 'top',
            },
            responsive: false,
            scales: {
                xAxes: [{
                    gridLines: {display: false, drawTicks: false, zeroLineColor: xColor},
                    ticks: {fontColor: xColor, fontStyle: 'bold', padding: 4},
                }],
                yAxes: [{
                    gridLines: {display: false, drawTicks: false, zeroLineColor: yColor},
                    ticks: {beginAtZero: false, callback: asDoller, fontColor: yColor, fontStyle: 'bold', padding: 4},
                }],
            },
            tooltips: {
                callbacks: {
                    label: ({datasetIndex: i, yLabel}, {datasets}) => `${datasets[i].label}: ${asDoller(yLabel)}`,
                },
                mode: 'index',
            },
        },
        type: 'line',
    });

    setInterval(trackPrices, 15 * 1000);
}
