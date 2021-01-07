import {toMap} from './util';

const get = url => fetch(url).then(a => a.json());
const post = (url, json) => fetch(url, {
    method: 'post', body: JSON.stringify(json), headers: {'Content-Type': 'application/json'},
});
const detailInstance = get('/details');
const itemInstance = get('/items');

export const account = () => get('/account');
export const details = () => detailInstance;
export const items = () => itemInstance;
export const inventory = () => get('/inventory').then(a => toMap(a, a => a.name, a => a.quantity));
export const prices = (item, max = 5) => get(`/prices/${max}/${item}`);
export const delayedPrices = (delay, item, max) => new Promise(res => setTimeout(() => res(prices(item, max)), delay * 1000));
export const update = json => post('/update', json);
