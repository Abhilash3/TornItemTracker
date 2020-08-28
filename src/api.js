import { fire, toMap } from './util';

const API_KEY = 'Your Api Key';
const DEFAULT_RESET_TIME = 10 * 1000;

const clone = (item, props = {}) => ({...item, ...props});
const query = (type, id, ...selections) => fire(`https://api.torn.com/${type}/${id}?selections=${selections.join(',')}&key=${API_KEY}`);

function cacheWrapped(service, resetTime = DEFAULT_RESET_TIME) {
    const cache = new Map();
    return function(...params) {
        const key = JSON.stringify(params);
        if (!cache.has(key)) {
            cache.set(key, service(...params));
            setTimeout(() => cache.delete(key), resetTime);
        }

        return cache.get(key);
    }
}

function itemPrices(itemId) {
    return query('market', itemId, 'itemmarket', 'bazaar').then(prices => {
        return Object.keys(prices).reduce((all, selection) => {
            const values = Object.keys(prices[selection] || {})
                .map(id => clone(prices[selection][id], { id, selection }));

            return [...all, ...values];
        }, []);
    });
}

export function allItems() {
    return query('torn', '', 'items')
        .then(response => response.items || []).catch(err => ({}))
        .then(items => Object.keys(items).map(id => clone(items[id], { id })));
}

export function inventory() {
    return query('user', '', 'inventory')
        .then(response => response.inventory || []).catch(err => [])
        .then(inventory => toMap(inventory, a => a.name, a => a.quantity));
}

export const priceDetails = cacheWrapped((itemId, max = 5) => {
    const EMPTY = [];
    return itemPrices(itemId).then(arr => {
        if (!arr.length) return EMPTY;
        const priceLog = arr.reduce((acc, {cost, quantity}) => {
            acc.set(cost, (acc.get(cost) || 0) + quantity);
            return acc;
        }, new Map());

        return Array.from(priceLog).sort((a, b) => a[0] - b[0]).filter((n, i) => i < max);
    }).catch(err => EMPTY);
});
