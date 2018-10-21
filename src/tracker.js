import { lowestItemPrice } from './api';
import { asElement, toMap } from './util';

import Chart from '../lib/chart.bundle.js';
import trackerTemplate from '../template/tracker.html';

const MAX_HISTORY = 2000;

function randomColor() {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return `rgb(${r},${g},${b})`;
}

async function trackPrices(items, history) {
    var prices = await Promise.all(items.map(item => lowestItemPrice(item.id)));

    chart.data.datasets = items.map((item, n) => {
        var color = history.get(item.name).color;
        var values = history.get(item.name).values;

        if (values.length === MAX_HISTORY) values.shift();
        values.push(prices[n]);

        return {
            label: item.name,
            borderColor: color,
            pointBorderColor: color,
            pointBackgroundColor: color,
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: color,
            pointBorderWidth: 5,
            pointHoverRadius: 5,
            pointHoverBorderWidth: 1,
            pointRadius: 0,
            fill: false,
            borderWidth: 2,
            data: values,
        };
    });
    chart.update();
}

var request;
var itemNames;
var chart;

export function init(parent) {
    var trackerTab = parent.querySelector('#tracker');
    trackerTab.appendChild(asElement(trackerTemplate));

    var context = trackerTab.querySelector('canvas.chart').getContext('2d');

    chart = new Chart(context, {
        type: 'line',
        data: {
            labels: new Array(MAX_HISTORY).fill(0).map((a, b) => MAX_HISTORY - b),
            datasets: []
        },
        options: {
            responsive: false,
            legend: { position: 'top' },
            scales: {
                yAxes: [{
                    ticks: {
                        fontColor: randomColor(),
                        fontStyle: 'bold',
                        beginAtZero: false,
                        padding: 4
                    },
                    gridLines: { drawTicks: false, display: false }
                }],
                xAxes: [{
                    gridLines: {
                        zeroLineColor: randomColor(),
                        drawTicks: false,
                        display: false
                    },
                    ticks: {
                        padding: 4,
                        fontColor: randomColor(),
                        fontStyle: 'bold'
                    }
                }]
            }
        }
    });
}

export function track(items) {
    var names = items.map(item => item.name).sort().join();
    if (names === itemNames) return;

    itemNames = names;
    if (request) clearTimeout(request);

    var history = toMap(items, a => a.name, () => ({ values: [], color: randomColor() }));

    trackPrices(items, history);
    request = setInterval(() => trackPrices(items, history), 15 * 1000);
}
