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

    const searched = searchTab.querySelector('div#searched');
    const selected = searchTab.querySelector('div#selected');

    searched.addEventListener('click', event => {
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
        searched.querySelector(`#item-${target.dataset.id}`).classList.remove('hide');
        target.parentNode.removeChild(target);
    });

    searchTab.querySelector('#export').addEventListener('click', event => {
        toClipboard(Array.prototype.map.call(selected.querySelectorAll('.item'), elem => elem.dataset.id).join(','));
    });

    searchTab.querySelector('#import').addEventListener('click', async () => {
        const selectedIds = Array.prototype.map.call(selected.querySelectorAll('.item'), a => a.dataset.id);

        (await fromClipboard()).split(',')
            .map(a => searched.querySelector(`#item-${a.trim()}`))
            .filter(a => a && !selectedIds.includes(a.dataset.id))
            .forEach(elem => elem.click());
    });

    const createBadge = count => `<span class='badge badge-secondary'>${count}</span>`;

    Promise.all([items, inventory()]).then(([items, userItems]) => {
        const itemDomList = [];
        items.forEach((item) => {
            const {id, name} = item;
            const quantity = userItems.get(name) || 0;
            item.count = quantity;
            const element = asElement(`
                <div class='item bg-light rounded d-lg-inline-flex p-2' id='item-${id}' data-id='${id}'>
                    <span>${name}</span>${quantity && createBadge(quantity) || ''}
                </div>`);
            searched.appendChild(element);
            itemDomList.push(element);
        });

        searchTab.querySelector('#refresh').addEventListener('click', async event => {
            event.preventDefault();

            const newItems = await inventory();
            const containers = [searched, selected];
            items.filter(({name}) => newItems.get(name) !== userItems.get(name)).forEach(item => {
                const {id, name} = item;
                containers.map(elem => elem.querySelector(`#item-${id}`)).filter(a => a).forEach(elem => {
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

            const query = parseQuery(event.target.value.trim());

            const itemMap = toMap(items, a => a.id);
            const selectedSet = new Set(Array.prototype.map.call(selected.querySelectorAll('.item'), a => a.dataset.id));
            itemDomList.forEach(({classList, dataset: {id}}) => {
                classList.remove('hide');
                if (selectedSet.has(id) || !query(itemMap.get(id))) classList.add('hide');
            });
        });
    });
}

export function selected() {
    const selectedItems = document.querySelectorAll('#search div#selected .item');
    return items.then(items => toMap(items, a => a.id))
        .then(map => Array.prototype.map.call(selectedItems, a => map.get(a.dataset.id)));
}
