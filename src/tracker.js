define(['text!../template/tracker.html', 'api', 'util', 'chart'], (trackerTemplate, api, util, Chart) => {

    const MAX = 2000;

    function randomColor() {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        return `rgb(${r},${g},${b})`;
    }

    function trackPrices(items, history, chart) {
        Promise.all(items.map(item => api.lowestItemPrice(item.id).catch(err => {cost: -1}))).then(prices => {
            items.forEach((item, n) => {
                var values = history[item.name].values
                if (values.length >= MAX){
                    values.shift();
                }
                values.push(Number(prices[n].cost));
            });

            chart.data.labels = new Array(MAX).fill(0).map((a, b) => MAX - b),
            chart.data.datasets = items.map((item, n) => {
                var color = history[item.name].color;

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
                    data: history[item.name].values,
                };
            })
            chart.update();
        });
    }

    var data = {};
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
                data: { labels: [], datasets: [] },
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
            items.then(arr => {
                var itemNames = arr.map(item => item.name).sort().join();
                if (itemNames === prevItemNames) {
                    return;
                }
                prevItemNames = itemNames;
                data = {};

                if (prevRequest) {
                    clearTimeout(prevRequest);
                }

                if (arr.length === 0) return;

                arr.forEach((item, n) => {
                    data[item.name] = { values: [], color: randomColor() };
                });

                trackPrices(arr, data, chart);
                prevRequest = setInterval(() => { trackPrices(arr, data, chart); }, 15 * 1000);
            });
        }
    }
});
