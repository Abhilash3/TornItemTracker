requirejs(['text!../template/main.html', 'search', 'tracker', 'trader', 'util'], function(mainTemplate, search, tracker, trader, util) {

    var main = document.querySelector('#main');
    main.appendChild(util.asElement(mainTemplate));

    var tabs = main.querySelectorAll('#container div.tab');
    main.querySelector('#container ul.nav').addEventListener('click', event => {
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

    main.querySelector('#container #track-tab').addEventListener('click', event => {
        tracker.track(search.selected());
    });
    main.querySelector('#container #trade-tab').addEventListener('click', event => {
        trader.trade(search.selected());
    });

    search.init(main);
    tracker.init(main);
    trader.init(main);

    main.querySelector('#container ul.nav li a.nav-link.active').click();
});
