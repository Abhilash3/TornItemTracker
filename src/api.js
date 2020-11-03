const fetch = require('node-fetch');

const DEFAULT_RESET_TIME = 10 * 1000;

const fire = url => fetch(url).then(a => a.json()).catch(a => {
    console.log(a);
    throw a;
});
const clone = (item, props = {}) => ({...item, ...props});
const query = (key, type, id, ...selections) => fire(`https://api.torn.com/${type}/${id}?selections=${selections.join(',')}&key=${key}`);

function cacheWrapped(service, resetTime = DEFAULT_RESET_TIME) {
    const cache = new Map();
    return function(...params) {
        const key = JSON.stringify(params);
        if (!cache.has(key)) {
            cache.set(key, service(...params));
            setTimeout(() => cache.delete(key), resetTime);
        }

        return cache.get(key);
    };
}

function itemPrices(key, itemId) {
    return query(key, 'market', itemId, 'itemmarket', 'bazaar').then(prices => {
        return Object.keys(prices).reduce((all, selection) => {
            const values = Object.keys(prices[selection] || {})
                .map(id => clone(prices[selection][id], { id, selection }));

            return [...all, ...values];
        }, []);
    });
}

module.exports.items = key => query(key, 'torn', '', 'items')
    .then(response => response.items || []).catch(err => ({}))
    .then(items => Object.keys(items).map(id => clone(items[id], {id})));

module.exports.inventory = key => query(key, 'user', '', 'inventory')
    .then(response => response.inventory || []).catch(err => []);

module.exports.prices = cacheWrapped((key, itemId, max = 5) => {
    const EMPTY = [];
    return itemPrices(key, itemId).then(arr => {
        if (!arr.length) return EMPTY;
        const priceLog = arr.reduce((acc, {cost, quantity}) => {
            acc.set(cost, (acc.get(cost) || 0) + quantity);
            return acc;
        }, new Map());

        return Array.from(priceLog).sort((a, b) => a[0] - b[0]).filter((n, i) => i < max);
    }).catch(err => EMPTY);
});
