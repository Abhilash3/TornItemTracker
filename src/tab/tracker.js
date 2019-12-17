import { priceDetails } from '../api';
import { asElement, randomColor, toMap } from '../util';
import Chart from '../../lib/chart.bundle';

import trackerTemplate from '../../template/tracker.html';

const MAX_HISTORY = 200;

function trackPrices(items, history) {
    Promise.all(items.map(item => priceDetails(item.id).then(prices => prices[0][0]))).then(prices => {
        chart.data.datasets = items.map((item, n) => {
            const {color, values} = history.get(item.name);

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
    });
}

var request;
var itemNames;
var chart;

export function init(parent) {
    const trackerTab = parent.querySelector('#tracker');
    trackerTab.appendChild(asElement(trackerTemplate));

    chart = new Chart(trackerTab.querySelector('canvas.chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: new Array(MAX_HISTORY).fill(0).map((a, b) => MAX_HISTORY - b),
            datasets: [],
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
                        padding: 4,
                    },
                    gridLines: { drawTicks: false, display: false },
                }],
                xAxes: [{
                    gridLines: {
                        zeroLineColor: randomColor(),
                        drawTicks: false,
                        display: false,
                    },
                    ticks: {
                        padding: 4,
                        fontColor: randomColor(),
                        fontStyle: 'bold',
                    },
                }],
            },
        }
    });
}

export function track(items) {
    const names = items.map(item => item.name).sort().join();
    if (names === itemNames) return;
    itemNames = names;

    if (request) clearInterval(request);
    if (!items.length) return;

    const history = toMap(items, a => a.name, () => ({ values: [], color: randomColor() }));

    trackPrices(items, history);
    request = setInterval(() => trackPrices(items, history), 15 * 1000);
}
