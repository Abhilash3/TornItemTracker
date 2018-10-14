requirejs(['text!../template/main.html', 'search', 'tracker', 'trader', 'util'], function(mainTemplate, search, tracker, trader, util) {

    var main = document.querySelector('#main');
    main.appendChild(util.asElement(mainTemplate));

    var tabs = main.querySelectorAll('div.tab');
    main.querySelector('ul.nav').addEventListener('click', event => {
        var tabId = event.target.getAttribute('href');
        if (!tabId) return;

        event.preventDefault();
        tabs.forEach(tab => {
            if (`#${tab.getAttribute('id')}` === tabId) {
                tab.classList.remove('hide');
                tab.classList.add('active');
            } else {
                tab.classList.add('hide');
                tab.classList.remove('active');
            }
        });
    });

    main.querySelector('#track-tab').addEventListener('click', async () => tracker.track(await search.selected()));
    main.querySelector('#trade-tab').addEventListener('click', async () => trader.trade(await search.selected()));

    [search, tracker, trader].forEach(a => a.init(main));

    main.querySelector('ul.nav li a.nav-link.active').click();
});
