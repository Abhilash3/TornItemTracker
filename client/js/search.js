import {inventory, items} from './api';
import {parseQuery} from './query';
import {asElement, asSearchItem, fromClipboard, toClipboard, toMap} from './util';

import searchTemplate from '../template/search.html';
import progressTemplate from '../template/progress.html';

function findTarget({target}) {
    if (target.nodeName.toLowerCase() === 'span') target = target.parentNode;
    if (!target.classList.contains('item')) return;
    return target;
}

const itemRequest = items();
let request = inventory();

function init(search, result, select, onSelect, onUnselect, available) {
    let searched = [];
    const selected = new Map();
    search.addEventListener('keyup', async event => {
        if (event.keyCode !== 13) return;
        event.preventDefault();
        const value = event.target.value.trim();
        result.innerHTML = '';
        searched = [];
        if (!value) return;

        result.innerHTML = progressTemplate;
        const query = parseQuery(value);
        result.innerHTML = progressTemplate;
        Promise.all([itemRequest, available && request || Promise.resolve(new Map())]).then(([items, inventory]) => {
            searched = items.filter(a => !selected.has(a.id) && (!available || inventory.get(a.name)) && query(a)).slice(0, 10);
            result.innerHTML = '';
            searched.forEach(({id, name}) => result.appendChild(asSearchItem(id, name, available ? inventory.get(a.name) : 0)));
        });
    });

    result.addEventListener('click', event => {
        if (!event.target.classList.contains('item')) return;
        event.preventDefault();

        const item = searched.find(a => a.id === event.target.dataset.id);
        selected.set(item.id, item);
        event.target.parentNode.removeChild(event.target);

        select.appendChild(asSearchItem(item.id, item.name, available ? event.target.dataset.count : 0));
        onSelect(item, event.target.dataset.count);
    });

    select.addEventListener('click', event => {
        if (!event.target.classList.contains('item')) return;
        event.preventDefault();

        const item = selected.get(event.target.dataset.id);
        result.appendChild(asSearchItem(item.id, item.name, available ? event.target.dataset.count : 0));
        selected.delete(item.id);
        event.target.parentNode.removeChild(event.target);

        onUnselect(item, event.target.dataset.count);
    });
}

function initLocal(container, onSelect, onUnselect, considerItems) {
    container.appendChild(asElement(searchTemplate));
    return init(
        container.querySelector('.search'), container.querySelector('.result'),
        container.querySelector('.select'), onSelect, onUnselect, considerItems);
}

export function inventoryRefresh() {
    request = inventory();
    return request;
}

export const itemSearch = (container, onSelect, onUnselect) => initLocal(container, onSelect, onUnselect, false);
export const inventorySearch = (container, onSelect, onUnselect) => initLocal(container, onSelect, onUnselect, true);

export const itemCompositeSearch = (search, result, select, onSelect, onUnselect) => {
    init(search, result, select || document.createElement('div'), onSelect, onUnselect, false);
};
export const inventoryCompositeSearch = (search, result, select, onSelect, onUnselect) => {
    init(search, result, select || document.createElement('div'), onSelect, onUnselect, true);
}
