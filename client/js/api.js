import {toMap} from './util';

const fire = (...params) => fetch(...params).catch(a => {
    console.log(a);
    throw a;
});
const get = url => fire(url).then(a => a.json());
const post = (url, json) => fire(url, {
    method: 'post', body: JSON.stringify(json), headers: {'Content-Type': 'application/json'},
});
const pointRequest = get('/points');
const itemRequest = get('/items');
const exchangeRequest = get('/exchanges');

export const user = () => get('/account');
export const points = () => pointRequest;
export const items = () => itemRequest;
export const inventory = () => get('/inventory').then(a => toMap(a, a => a.name, a => a.quantity));
export const prices = (items, max = 5) => get(`/prices/${max}/${items.join(',')}`);
export const update = json => post('/update', json);
export const exchanges = () => exchangeRequest;
export const exchange = name => get(`/exchange/${name}`);
