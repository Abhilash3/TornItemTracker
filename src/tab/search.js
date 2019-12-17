import { parseQuery } from '../query';
import { allItems, inventory } from '../api';
import { asElement, fromClipboard, toClipboard, toMap } from '../util';

import searchTemplate from '../../template/search.html';

function findTarget({target}) {
    if (target.nodeName.toLowerCase() === 'span') target = target.parentNode;
    if (!target.classList.contains('item')) return;
    return target;
}

const items = allItems();

export function init(parent) {
    const searchTab = parent.querySelector('#search');
    searchTab.appendChild(asElement(searchTemplate));

    const searchResults = searchTab.querySelector('div#search-result');
    const selected = searchTab.querySelector('div#selected');

    searchResults.addEventListener('click', event => {
        const target = findTarget(event);
        if (!target) return;

        event.preventDefault();
        const clone = target.cloneNode(true);
        clone.classList.remove('hide');
        selected.appendChild(clone);
        target.classList.add('hide');
    });
    selected.addEventListener('click', event => {
        const target = findTarget(event);
        if (!target) return;

        event.preventDefault();
        searchResults.querySelector(`#item-${target.dataset.id}`).classList.remove('hide');
        target.parentNode.removeChild(target);
    });

    searchTab.querySelector('#export').addEventListener('click', event => {
        const items = selected.querySelectorAll('.item');
        toClipboard(Array.prototype.map.call(items, elem => elem.dataset.id).toString());
    });

    searchTab.querySelector('#import').addEventListener('click', async () => {
        const selectedIds = Array.prototype.map.call(selected.querySelectorAll('.item'), a => a.dataset.id);

        const str  = await fromClipboard();
        str.split(',')
            .map(a => searchResults.querySelector(`#item-${a.trim()}`))
            .filter(a => a && !selectedIds.includes(a.dataset.id))
            .forEach(elem => elem.click());
    });

    const createBadge = (q) => `<span class='badge badge-secondary'>${q}</span>`;

    Promise.all([items, inventory()]).then(([items, userItems]) => {
        items.forEach((item) => {
            const {id, name} = item;
            const quantity = userItems.get(name) || 0;
            searchResults.appendChild(asElement(`
                <div class='item bg-light rounded d-lg-inline-flex p-2' id='item-${id}' data-id='${id}'>
                    <span>${name}</span>
                    ${quantity && createBadge(quantity) || ''}
                </div>`));
            item.count = quantity;
        });

        searchTab.querySelector('#refresh').addEventListener('click', async event => {
            event.preventDefault();

            const newItems = await inventory();
            const containers = [searchResults, selected];
            items.filter(({name}) => newItems.get(name) !== userItems.get(name)).forEach((item) => {
                const {id, name} = item;
                containers
                    .map(elem => elem.querySelector(`#item-${id}`))
                    .filter(a => a)
                    .forEach(elem => {
                        const quantity = newItems.get(name) || 0;
                        const badge = elem.querySelector('span.badge');

                        if (badge && quantity) {
                            badge.innerHTML = quantity;
                        } else if (badge) {
                            elem.removeChild(badge);
                        } else if (quantity) {
                            elem.appendChild(asElement(createBadge(quantity)));
                        }
                        item.count = quantity;
                    });
            });
        });

        searchTab.querySelector('input#search-item').addEventListener('keyup', event => {
            if (event.keyCode !== 13) return;
            event.preventDefault();

            const searchQuery = parseQuery(event.target.value.trim());

            searchResults.querySelectorAll('.item').forEach(a => a.classList.add('hide'));
            const selectedIds = Array.prototype.map.call(selected.querySelectorAll('.item'), a => a.dataset.id);

            items.filter(a => searchQuery(a) && !selectedIds.includes(a.id))
                .forEach(({id}) => searchResults.querySelector(`#item-${id}`).classList.remove('hide'));
        });
    });
}

export function selected() {
    const selectedItems = document.querySelectorAll('#search div#selected .item');
    return items.then(items => toMap(items, a => a.id))
        .then(map => Array.prototype.map.call(selectedItems, a => map.get(a.dataset.id)));
}
