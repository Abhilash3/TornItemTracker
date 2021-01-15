import {inventory, items} from './api';
import {parseQuery} from './query';
import {asElement, asSearchItem, fromClipboard, toClipboard, toMap} from './util';

import progressTemplate from '../template/progress.html';

function findTarget({target}) {
    if (target.nodeName.toLowerCase() === 'span') target = target.parentNode;
    if (!target.classList.contains('item')) return;
    return target;
}

const itemRequest = items();
let request = inventory();

function initSearch(search, result, callback, considerItems) {
    let searched = [];
    const selected = new Map();
    const createSearchItem = (id, name, count) => asSearchItem(id, name, considerItems && count);
    search.addEventListener('keyup', async event => {
        if (event.keyCode !== 13) return;
        event.preventDefault();
        const value = event.target.value.trim();
        result.innerHTML = '';
        searched = [];
        if (!value) return;

        result.innerHTML = progressTemplate;
        const query = parseQuery(value);
        const itemCount = await request;
        searched = (await itemRequest)
            .filter(a => !selected.has(a.id) && (!considerItems || !!itemCount.get(a.name)) && query(a)).slice(0, 10);
        result.innerHTML = '';
        searched.forEach(({id, name}) => result.appendChild(createSearchItem(id, name, itemCount.get(name))));
    });

    result.addEventListener('click', ({target}) => {
        if (!target.classList.contains('item')) return;
        event.preventDefault();

        const item = searched.find(a => a.id === target.dataset.id);
        selected.set(item.id, item);
        target.parentNode.removeChild(target);

        callback(item, target.dataset.count);
    });

    return id => request.then(a => {
        const {name} = selected.get(id);
        result.appendChild(createSearchItem(id, name, a.get(name)));
        selected.delete(id);
    });
}

export function inventoryRefresh() {
    request = inventory();
    return request;
}

export function itemSearch(search, result, callback) {
    return initSearch(search, result, callback, false);
}

export function inventorySearch(search, result, callback) {
    return initSearch(search, result, callback, true);
}
