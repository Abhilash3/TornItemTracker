define(['text!../template/search.html', 'text!../template/item.html', 'api', 'util'], (searchTemplate, itemTemplate, api, util) => {

    function itemAsElement(id, item) {
        var element = util.asElement(itemTemplate);
        var image = element.querySelector('img');

        [['id', `item-${id}`], ['title', `${id}: ${item.name}`], ['data-id', id]].forEach(a => element.setAttribute(a[0], a[1]));
        [['src', item.image], ['alt', item.name]].forEach(a => image.setAttribute(a[0], a[1]));

        return element;
    }

    function itemClickTemplate(handler, event) {
        var target = event.target;
        if (target.nodeName.toLowerCase() === 'img') target = target.parentNode;
        if (!target.classList.contains('item')) return;

        event.preventDefault();
        handler(target);
    }

    var items = api.allItems().then(response => Object.keys(response.items).map(id => {
        var clone = Object.create(response.items[id]);
        clone.id = id;
        return clone;
    })).catch(err => []);
    var itemMap = items.then(items => util.toMap(items, a => a.id));

    var selected;

    return {
        init(parent) {
            var searchTab = parent.querySelector('#search');
            searchTab.appendChild(util.asElement(searchTemplate));

            var searchResults = searchTab.querySelector('div#search-result');
            selected = searchTab.querySelector('div#selected');

            var typeSelect = searchTab.querySelector('#search-type');
            var searchInput = searchTab.querySelector('input#search-item');

            searchResults.addEventListener('click', itemClickTemplate.bind(this, target => {
                target.classList.add('hide');
                itemMap.then(items => selected.appendChild(itemAsElement(target.dataset.id, items.get(target.dataset.id))));
            }));
            selected.addEventListener('click', itemClickTemplate.bind(this, target => {
                searchResults.querySelector(`#item-${target.dataset.id}`).classList.remove('hide');
                target.parentNode.removeChild(target);
            }));

            searchTab.querySelector('#export').addEventListener('click', event => {
                util.toClipboard(Array.prototype.map.call(selected.querySelectorAll('.item'), elem => elem.dataset.id).toString());
            });

            searchTab.querySelector('#import').addEventListener('click', async () => {
                var str = await util.fromClipboard();
                str.split(',').map(a => searchResults.querySelector(`#item-${a.trim()}`))
                    .filter(a => a && !a.classList.contains('hide')).forEach(elem => elem.click());
            });

            let prevRequest;
            [[typeSelect, 'change'], [searchInput, 'keyup']].forEach(a => a[0].addEventListener(a[1], event => {
                event.preventDefault();
                if (prevRequest) clearTimeout(prevRequest);

                var value = searchInput.value.trim().toLowerCase();
                var type = typeSelect.value;

                prevRequest = setTimeout(() => items.then(items => {
                    searchResults.querySelectorAll('.item').forEach(a => a.classList.add('hide'));
                    var selectedIds = Array.prototype.map.call(selected.querySelectorAll('.item'), a => a.dataset.id);

                    items.filter(a => ('' + a[type]).toLowerCase().includes(value) && !selectedIds.includes(a.id))
                        .forEach(a => searchResults.querySelector(`#item-${a.id}`).classList.remove('hide'));
                }), 0.5 * 1000);
            }));

            items.then(items => items.forEach(a => searchResults.appendChild(itemAsElement(a.id, a))));
        },

        selected() {
            return itemMap.then(items => {
                return Array.prototype.map.call(selected.querySelectorAll('.item'), a => items.get(a.dataset.id));
            });
        }
    }
});
