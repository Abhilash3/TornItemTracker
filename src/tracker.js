define(['text!../template/tracker.html', 'api', 'util', 'chart'], (trackerTemplate, api, util, Chart) => {

    const MAX_HISTORY_ENTRIES = 200;

    function randomColor() {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        return `rgb(${r},${g},${b})`;
    }

    async function trackPrices(items, history) {
        var prices = await Promise.all(items.map(item => api.lowestItemPrice(item.id)));

        chart.data.datasets = items.map((item, n) => {
            var color = history.get(item.name).color;
            var values = history.get(item.name).values;

            if (values.length === MAX_HISTORY_ENTRIES) {
                values.shift();
            }
            values.push(Number(prices[n].cost));

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

    var prevRequest;
    var prevItemNames;
    var chart;

    return {
        init(parent) {
            var trackerTab = parent.querySelector('#tracker');
            trackerTab.appendChild(util.asElement(trackerTemplate));

            var context = trackerTab.querySelector('canvas.chart').getContext('2d');

            chart = new Chart(context, {
                type: 'line',
                data: {
                    labels: new Array(MAX_HISTORY_ENTRIES).fill(0).map((a, b) => MAX_HISTORY_ENTRIES - b),
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
        },

        track(items) {
            var itemNames = items.map(item => item.name).sort().join();
            if (itemNames === prevItemNames) return;

            prevItemNames = itemNames;
            if (prevRequest) clearTimeout(prevRequest);

            var history = util.toMap(items, a => a.name, () => ({ values: [], color: randomColor() }));

            trackPrices(items, history);
            prevRequest = setInterval(() => trackPrices(items, history), 15 * 1000);
        }
    }
});
