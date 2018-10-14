define(['text!../template/trader.html', 'api', 'util'], function(traderTemplate, api, util) {

    function calculators(items, prices, inventory) {
        return items.map((item, n) => {
            var quantity = inventory.get(Number(item.id)) || 0;
            return util.asElement(`
                <tr id="calc-${item.id}" data-id="${item.id}" class="row item-calc">
                    <td class="col">${item.name}</td>
                    <td class="col price">${prices[n].cost}</td>
                    <td class="col"><input type="number" class="form-control" placeholder="price..." /></td>
                    <td class="col count">${quantity}</td>
                    <td class="col-3 value">0</td>
                </tr>`);
        });
    }

    var tbody;
    var total;
    var prevItemNames;
    var requests;

    return {
        init(parent) {
            var traderTab = parent.querySelector('#trader');
            traderTab.appendChild(util.asElement(traderTemplate));

            tbody = traderTab.querySelector('table#calc tbody');
            total = traderTab.querySelector('#total');

            traderTab.addEventListener('keyup', event => {
                var tr = event.target.parentNode.parentNode;
                var count = tr.querySelector('.count').innerHTML;
                var price = tr.querySelector('input').value;

                tr.querySelector('.value').innerHTML = Number(price) * Number(count);

                total.innerHTML = Array.prototype.reduce.call(traderTab.querySelectorAll('.value'), (sum, elem) => {
                    return sum + Number(elem.innerHTML);
                }, 0);
            });
        },

        trade(items) {
            var itemNames = items.map(item => item.name).sort().join();
            if (itemNames === prevItemNames) return;

            prevItemNames = itemNames;

            tbody.innerHTML = '';
            total.innerHTML = '0';
            if (requests) requests.forEach(clearInterval);

            var inventory = api.userQuery('inventory')
                .then(response => util.toMap(response.inventory, a => Number(a.ID), a => a.quantity))
                .catch(err => util.toMap([]));

            var prices = Promise.all(items.map(item => api.lowestItemPrice(item.id)));

            (async function() {
                requests = calculators(items, await prices, await inventory).map(elem => {
                    tbody.appendChild(elem);

                    var display = elem.querySelector('.price');
                    return setInterval(async function() {
                        var price = await api.lowestItemPrice(elem.dataset.id);
                        display.innerHTML = price.cost;
                    }, 15 * 1000);
                });
            })();
        }
    };
});
