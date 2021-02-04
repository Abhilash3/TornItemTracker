import {points, update} from './api';
import {asElement} from './util';

import accountTemplate from '../template/account.html';
import progressTemplate from '../template/progress.html';

function setupAuto(elements, delay = 10) {
    let i = 0;
    setInterval(() => {
        i = (i + 1) % elements.length;
        elements[i].click();
    }, delay * 1000);
}

function setupPoints(container, points) {
    const pointTypes = Object.keys(points);
    if (pointTypes.length) {
        container.innerHTML = pointTypes.reduce((acc, type) => {
            return acc + `<div class='card'><div class='card-body'><strong>${type}: </strong>${points[type]}</div></div>`;
        }, '<div class=\'card-columns\'>') + '</div>';
    } else {
        container.innerHTML = '<h5>None</h5>';
    }
}

export function init(parent) {
    const accountTab = parent.querySelector('#account');
    accountTab.appendChild(asElement(accountTemplate));

    accountTab.querySelector('#points').innerHTML = progressTemplate;
    points().then(a => {
        setupPoints(accountTab.querySelector('#points'), a);
        setupAuto(['#stat', '#point'].map(a => accountTab.querySelector(a)));
    });
}
