import {details, update} from './api';
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

function setupStats(container, stats) {
    const labels = ['defense', 'strength', 'speed', 'dexterity'];
    const values = labels.map(type => stats[type].value * 100 / stats.total);
    const max = Math.ceil(Math.max(...values) / 10) * 10;
    const imageUrl = 'https://image-charts.com/chart?&cht=r&chxt=r&chxr=0,0,' + max +
        '&chs=400x400&chxl=0:|' + new Array(max / 5 + 1).fill(0).map((a, i) => i * 5 + '%').join('|') +
        '&chl=' + labels.map(a => a[0].toUpperCase() + a.slice(1)).join('|') +
        '&chd=t:' + [...values, values[values.length - 1]].join(',');
    container.appendChild(asElement('<img style=\'border-radius: 150px !important;\' src=\'' + imageUrl + '\'></img>'))
}

export function init(parent) {
    const accountTab = parent.querySelector('#account');
    accountTab.appendChild(asElement(accountTemplate));

    accountTab.querySelector('#name').innerHTML = progressTemplate;
    accountTab.querySelector('#points').innerHTML = progressTemplate;
    details().then(a => {
        accountTab.querySelector('#name').innerHTML = a.user.name;

        setupPoints(accountTab.querySelector('#points'), a.points);
        setupStats(accountTab.querySelector('#stats'), a.battleStats);

        setupAuto(['#point', '#stat'].map(a => accountTab.querySelector(a)));
    });
}
