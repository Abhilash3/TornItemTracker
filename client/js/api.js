import {toMap} from './util';

const fire = (...params) => fetch(...params).catch(a => {
    console.log(a);
    throw a;
});
const get = url => fire(url).then(a => a.json());
const post = (url, json) => fire(url, {
    method: 'post', body: JSON.stringify(json), headers: {'Content-Type': 'application/json'},
});
const detailRequest = get('/details');
const itemRequest = get('/items');
const exchangeRequest = get('/exchanges');

export const account = () => get('/account');
export const details = () => detailRequest;
export const items = () => itemRequest;
export const inventory = () => get('/inventory').then(a => toMap(a, a => a.name, a => a.quantity));
export const prices = (item, max = 5) => get(`/prices/${max}/${item}`);
export const delayedPrices = (delay, item, max) => new Promise(res => setTimeout(() => res(prices(item, max)), delay * 1000));
export const update = json => post('/update', json);
export const exchanges = () => exchangeRequest;
