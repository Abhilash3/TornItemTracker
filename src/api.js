import * as util from './util';

const API_KEY = 'Your Api Key';

function itemPrices(itemId) {
    return query('market', itemId, 'itemmarket,bazaar').then(prices => {
        var allPrices = Object.keys(prices).reduce((all, selection) => {
            var values = Object.keys(prices[selection]).map(id => {
                var clone = Object.create(prices[selection][id]);
                clone.id = id;
                clone.selection = selection;
                return clone;
            });

            return [...all, ...values];
        }, []);

        return {
            market: prices.itemmarket,
            bazaar: prices.bazaar,
            prices: allPrices
        };
    });
}

function query(type, id, selections) {
    return util.query(`https://api.torn.com/${type}/${id}?selections=${selections}&key=${API_KEY}`);
}

function tornQuery(selection) {
    return query('torn', '',  selection);
}

function userQuery(selection) {
    return query('user', '', selection);
}

export function allItems() {
    return tornQuery('items');
}

export function lowestItemPrice(itemId) {
    return itemPrices(itemId).then(response => {
        var prices = response.prices.map(price => price.cost);
        if (!prices.length) return 'N/A';

        return prices.reduce((a, b) => a > b ? b : a);
    }).catch(err => 'N/A');
}

export function inventory () {
    return userQuery('inventory')
        .then(response => response.inventory).catch(err => [])
        .then(inventory => util.toMap(inventory, a => a.name, a => a.quantity));
}
