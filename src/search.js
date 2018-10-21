import { allItems, inventory } from './api';
import * as util from './util';

import searchTemplate from '../template/search.html';

function itemAsElement(id, item, userItems) {
    var itemCount = userItems.get(item.name);
    return util.asElement(`
        <div class='item bg-light rounded d-lg-inline-flex p-2' id='item-${id}' data-id='${id}'>
            <span>${item.name}</span>
            ${itemCount ? `<span class='badge badge-secondary'>${itemCount}</span>` : ''}
        </div>`);
}

function itemClickTemplate(handler, event) {
    var target = event.target;
    if (target.nodeName.toLowerCase() === 'span') target = target.parentNode;
    if (!target.classList.contains('item')) return;

    event.preventDefault();
    handler(target);
}

var items = allItems().then(response => Object.keys(response.items).map(id => {
    var clone = Object.create(response.items[id]);
    clone.id = id;
    return clone;
})).catch(err => []);
var itemMap = items.then(items => util.toMap(items, a => a.id));

var userItems = inventory();

export function init(parent) {
    var searchTab = parent.querySelector('#search');
    searchTab.appendChild(util.asElement(searchTemplate));

    var searchResults = searchTab.querySelector('div#search-result');
    var selected = searchTab.querySelector('div#selected');

    var typeSelect = searchTab.querySelector('#search-type');
    var searchInput = searchTab.querySelector('input#search-item');

    searchResults.addEventListener('click', itemClickTemplate.bind(this, target => {
        selected.appendChild(target.cloneNode(true));
        target.classList.add('hide');
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

    Promise.all([items, userItems]).then(arr => arr[0].forEach(a => searchResults.appendChild(itemAsElement(a.id, a, arr[1]))));
}

export function selected() {
    return itemMap.then(items => {
        return Array.prototype.map.call(document.querySelectorAll('#search div#selected .item'), a => items.get(a.dataset.id));
    });
}
