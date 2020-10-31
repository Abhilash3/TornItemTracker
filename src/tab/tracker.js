import { priceDetails } from '../api';
import { asDoller, asElement, randomColor, toMap } from '../util';
import Chart from 'chart.js';

import trackerTemplate from '../../template/tracker.html';

const MAX_HISTORY = 1000;
const history = new Map();
const items = new Map();
const interest = new Set();

function requestPermission(id, name) {
   Notification.requestPermission(permission => {
      if (permission === 'granted') notify(id, name);
   });
}

function notify(id, name) {
    if (Notification.permission === 'default') requestPermission(id, name);
    if (Notification.permission === 'granted') {
        const notification = new Notification(
            `Item ${name} is cheap.`, {tag: 'torn', body: 'Click here to open market'});
        notification.onclick = () => {
            window.open(`https://www.torn.com/imarket.php#/p=shop&step=shop&type=${id}`);
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
            borderColor: color,
            borderWidth: 2,
            data: values,
            fill: false,
            label: name,
            pointBackgroundColor: color,
            pointBorderColor: color,
            pointBorderWidth: 5,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: color,
            pointHoverBorderWidth: 1,
            pointHoverRadius: 5,
            pointRadius: 0,
        }));
    chart.update();
}

function trackPrices() {
    request = setTimeout(trackPrices, 15 * 1000);
    if (!chart) return;

    const max = (values) => values.reduce((a, b) => Math.max(a, b), -1);
    const priceWithDelay = (id, i) => new Promise(res => setTimeout(() => res(priceDetails(id)), i * 1000));
    Promise.all(Array.from(items).map(([name, id], i) => priceWithDelay(id, i).then(prices => [name, prices[0][0]]))).then(prices => {
        const priceMap = new Map(prices);
        updateDatasets((name, {values}) => {
            const value = priceMap.get(name);
            values.shift();
            values.push(value);

            const isValid = values.some(a => a);
            if (!isValid) history.delete(name);

            if (value && (value / max(values)) <= 0.8) notify(items.get(name), name);

            return isValid;
        });
    });
}

export function init(parent) {
    const trackerTab = parent.querySelector('#tracker');
    trackerTab.appendChild(asElement(trackerTemplate));

    chart = new Chart(trackerTab.querySelector('canvas.chart').getContext('2d'), {
        data: {
            datasets: [],
            labels: new Array(MAX_HISTORY).fill(0).map((a, b) => MAX_HISTORY - b),
        },
        options: {
            animation: { duration: 0 },
            elements: { line: { tension: 0 } },
            legend: {
                onClick: (e, {text}) => {
                    const log = history.get(text);
                    if (log) log.color = randomColor();
                    updateDatasets();
                },
                position: 'top',
            },
            responsive: false,
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false,
                        drawTicks: false,
                        zeroLineColor: randomColor(),
                    },
                    ticks: {
                        fontColor: randomColor(),
                        fontStyle: 'bold',
                        padding: 4,
                    },
                }],
                yAxes: [{
                    gridLines: { display: false, drawTicks: false },
                    ticks: {
                        beginAtZero: false,
                        callback: asDoller,
                        fontColor: randomColor(),
                        fontStyle: 'bold',
                        padding: 4,
                    },
                }],
            },
            tooltips: {
                callbacks: {
                    label: ({datasetIndex, yLabel}, {datasets}) => `${datasets[datasetIndex].label}: ${asDoller(yLabel)}`,
                },
                mode: 'index',
            },
        },
        type: 'line',
    });
}

export function track(toTrack) {
    items.clear();
    toTrack.forEach(({id, name}, i) => {
        items.set(name, id);
        history.set(name, history.get(name) || {values: new Array(MAX_HISTORY), color: randomColor()});
    });

    if (!request) trackPrices();
}
