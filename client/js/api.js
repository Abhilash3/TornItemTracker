import {toMap} from './util';

const get = url => fetch(url).then(a => a.json());
const post = (url, json) => fetch(url, {
    method: 'post', body: JSON.stringify(json), headers: {'Content-Type': 'application/json'},
});

export const account = () => get('/account');
export const items = get('/items');
export const inventory = () => get('/inventory').then(a => toMap(a, a => a.name, a => a.quantity));
export const prices = (item, max = 5) => get(`/prices/${max}/${item}`);
export const update = json => post('/update', json);
