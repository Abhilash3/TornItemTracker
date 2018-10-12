define(['text!../template/trader.html', 'api', 'util'], function(traderTemplate, api, util) {

    function calculators(items, prices, inventory) {
        return items.map((item, n) => {
            var quantity = inventory[item.id] || 0;
            return util.asElement(`<tr id="calc-${item.id}" data-id=${item.id} class="row item-calc">` +
                `<td class="col">${item.name}</td>` +
                `<td class="col price">${prices[n].cost}</td>` +
                '<td class="col"><input type="number" class="form-control" placeholder="price..." /></td>' +
                `<td class="col count">${quantity}</td>` +
                '<td class="col-3 total">0</td>' +
                '</tr>');
        });
    }

    var tbody;
    var result;
    var requests;

    return {
        init(parent) {
            var traderTab = parent.querySelector('#trader');
            traderTab.appendChild(util.asElement(traderTemplate));

            tbody = traderTab.querySelector('table#calc tbody');
            result = traderTab.querySelector('#result');

            traderTab.addEventListener('keyup', event => {
                var tr = event.target.parentNode.parentNode;
                var count = tr.querySelector('.count').innerHTML;
                var price = tr.querySelector('input').value;

                tr.querySelector('.total').innerHTML = Number(price) * Number(count);

                var total = Array.prototype.reduce.call(traderTab.querySelectorAll('.total'), (sum, elem) => {
                    return sum + Number(elem.innerHTML);
                }, 0);
                result.innerHTML = total;
            });
        },

        trade(items) {
            tbody.innerHTML = '';
            result.innerHTML = '0';
            if (requests) requests.forEach(request => clearInterval(request));

            var inventory = api.userQuery('inventory').then(response => util.toMap(response.inventory, a => a.ID, a => a.quantity));
            items.then(arr => {
                requests = []
                Promise.all(arr.map(item => api.lowestItemPrice(item.id).catch(err => {cost: -1}))).then(prices => {
                    inventory.then(inventory => {
                        calculators(arr, prices, inventory).forEach(elem => {
                            tbody.appendChild(elem);
                            requests.push(setInterval(() => {
                                api.lowestItemPrice(elem.dataset.id).catch(err => {cost: -1}).then(price => {
                                    elem.querySelector('.price').innerHTML = price.cost;
                                });
                            }, 15 * 1000));
                        });
                    });
                });
            });
        }
    };
});
