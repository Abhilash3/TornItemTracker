define(['util'], util => {
    const API_KEY = 'Your Api Key';

    const DEFAULT_PRICE = {cost: -1};

    function allItems() {
        return tornQuery('items');
    }

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

    function lowestItemPrice(itemId) {
        return itemPrices(itemId).then(a => a.prices.reduce((b, c) => b.cost > c.cost || b.cost === -1 ? c : b, DEFAULT_PRICE))
            .catch(err => DEFAULT_PRICE);
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

    return {
        allItems,
        lowestItemPrice,
        tornQuery,
        userQuery
    };
});
