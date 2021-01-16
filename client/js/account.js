import {details, update} from './api';
import {asElement} from './util';

import accountTemplate from '../template/account.html';
import progressTemplate from '../template/progress.html';

export function init(parent) {
    const accountTab = parent.querySelector('#account');
    accountTab.appendChild(asElement(accountTemplate));

    accountTab.querySelector('#name').innerHTML = progressTemplate;
    accountTab.querySelector('#points').innerHTML = progressTemplate;
    details().then(a => {
        console.log(a);
        accountTab.querySelector('#name').innerHTML = a.user.name;

        const pointTypes = Object.keys(a.points);
        if (pointTypes.length) {
            accountTab.querySelector('#points').innerHTML = pointTypes.reduce((acc, type) => {
                return acc + `<div class='card'><div class='card-body'><strong>${type}: </strong>${a.points[type]}</div></div>`;
            }, '<div class=\'card-columns\'>') + '</div>';
        } else {
            accountTab.querySelector('#points').innerHTML = '<h5>None</h5>';
        }
    });
}
