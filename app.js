requirejs.config({
    baseUrl: 'src',
    paths: {
        text: '../lib/text',
        chart: '../lib/chart.bundle',

        api: 'api',
        details: 'details',
        main: 'main',
        search: 'search',
        tracker: 'tracker',
        trader: 'trader',
        util: 'util'
    }
});

requirejs(['text', 'main']);
