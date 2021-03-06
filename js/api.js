const fetch = require('node-fetch');

const DEFAULT_RESET_TIME = 10 * 1000;
const AN_HOUR_RESET_TIME = 60 * 60 * 1000;

const fire = url => fetch(url).catch(a => {
    console.log(a);
    throw a;
}).then(a => a.json());
const clone = (item, props = {}) => ({...item, ...props});
const query = (key, type, id, ...selections) => fire(`https://api.torn.com/${type}/${id}?selections=${selections.join(',')}&key=${key}`);

function cacheWrapped(service, resetTime, idFier) {
    const cache = new Map();
    return function(...params) {
        const key = idFier(params);
        if (!cache.has(key)) {
            cache.set(key, service(...params));
            setTimeout(() => cache.delete(key), resetTime);
        }

        return cache.get(key);
    };
}

function userCache(service, resetTime = DEFAULT_RESET_TIME) {
    return cacheWrapped(service, resetTime, a => JSON.stringify(a));
}

function globalCache(service, resetTime = DEFAULT_RESET_TIME) {
    return cacheWrapped(service, resetTime, ([a, ...r]) => JSON.stringify(r));
}

const itemPrices = globalCache((key, itemId) => query(key, 'market', itemId, 'itemmarket', 'bazaar')
    .then(prices => Object.keys(prices).reduce((all, type) => {
        const values = Object.keys(prices[type] || {}).map(id => clone(prices[type][id], {id, type}));
        return [...all, ...values];
    }, [])));

const pointPrices = globalCache(key => query(key, 'market', '', 'pointsmarket')
        .then(({pointsmarket: prices}) => Object.keys(prices || {})
        .map(id => clone(prices[id], {id}))));

const battleStatTypes = ['strength', 'speed', 'defense', 'dexterity'];
const perkTypes = ['job', 'property', 'stock', 'merit', 'education', 'enhancer', 'company', 'faction', 'book'];
module.exports.details = userCache(key => query(key, 'user', '', 'basic', 'battlestats', 'perks', 'jobpoints').then(a => {
    const battleStats = battleStatTypes.reduce((acc, key) => {
        acc[key] = {value: a[key], modifier: a[key + '_modifier'], info: a[key + '_info']};
        acc.total += acc[key].value;
        return acc;
    }, {total: 0});

    const perks = perkTypes.reduce((acc, key) => {
        acc[key] = a[key + '_perks'];
        acc.total += acc[key].length;
        return acc;
    }, {total: 0});

    return {
        user: {level: a.level, gender: a.gender, userId: a.player_id, name: a.name},
        battleStats, perks,
        points: {
            ...a.jobpoints.jobs,
            ...Object.keys(a.jobpoints.companies).reduce((acc, key) => {
                acc[a.jobpoints.companies[key].name] = a.jobpoints.companies[key].jobpoints;
                return acc;
            }, {}),
        },
    };
}), AN_HOUR_RESET_TIME);

module.exports.basic = key => query(key, 'user', '', 'basic');

module.exports.items = globalCache(key => query(key, 'torn', '', 'items').then(a => a.items || {})
    .then(a => ({0: {name: 'Point'}, ...a})).catch(err => ({}))
    .then(items => Object.keys(items).map(id => clone(items[id], {id}))), AN_HOUR_RESET_TIME);

module.exports.inventory = key => query(key, 'user', '', 'inventory').then(a => a.inventory || []).catch(err => []);

function prices(key, itemId, max = 5) {
    const EMPTY = [];
    return (Number(itemId) && itemPrices(key, itemId) || pointPrices(key)).then(arr => {
        if (!arr.length) return EMPTY;
        const priceLog = arr.reduce((acc, {cost, quantity}) => {
            acc.set(cost, (acc.get(cost) || 0) + quantity);
            return acc;
        }, new Map());

        return Array.from(priceLog).sort((a, b) => a[0] - b[0]).filter((n, i) => i < max);
    }).catch(err => EMPTY);
}

module.exports.prices = (key, ids, max) => Promise.all(
    ids.map((a, i) => new Promise(res => setTimeout(() => res(prices(key, a, max)), i * 1000))));
