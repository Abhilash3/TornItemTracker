import { priceDetails } from '../api';
import { asElement, randomColor, toMap } from '../util';
import Chart from 'chart.js';

import trackerTemplate from '../../template/tracker.html';

const MAX_HISTORY = 200;
const history = new Map();
const items = [];

let request;
let chart;

function updateDatasets(filter = () => true) {
    chart.data.datasets = Array.from(history).filter(([name, log]) => filter(name, log)).map(([name, log]) => {
        return {
            borderColor: log.color,
            borderWidth: 2,
            data: log.values,
            fill: false,
            label: name,
            pointBackgroundColor: log.color,
            pointBorderColor: log.color,
            pointBorderWidth: 5,
            pointHoverBackgroundColor: log.color,
            pointHoverBorderColor: log.color,
            pointHoverBorderWidth: 1,
            pointHoverRadius: 5,
            pointRadius: 0,
        };
    });
    chart.update();
}

function resetColors() {
    Array.from(history).forEach(([, log]) => log.color = randomColor());
    updateDatasets();
}

function trackPrices() {
    request = setTimeout(trackPrices, 15 * 1000);
    if (!chart) return;

    Promise.all(items.map(item => priceDetails(item.id).then(prices => ({name: item.name, price: prices[0][0]})))).then(prices => {
        const priceMap = new Map(prices.map(({name, price}) => [name, price]));
        updateDatasets((name, {values}) => {
            values.shift();
            values.push(priceMap.get(name));
            
            const isValid = values.some(a => a);
            if (!isValid) history.delete(name);
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
            legend: {
                onClick: resetColors,
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
                        fontColor: randomColor(),
                        fontStyle: 'bold',
                        padding: 4,
                    },
                }],
            },
            tooltips: { mode: 'index' },
        },
        type: 'line',
    });
}

export function track(toTrack) {
    items.length = toTrack.length;
    toTrack.forEach((item, i) => {
        items[i] = item;
        history.set(item.name, history.get(item.name) || { values: new Array(MAX_HISTORY), color: randomColor() });
    });
    
    if (!request) trackPrices();
}
