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
        accountTab.querySelector('#name').innerHTML = a.user.name;

        const pointTypes = Object.keys(a.points);
        if (pointTypes.length) {
            accountTab.querySelector('#points').innerHTML = pointTypes.reduce((acc, type) => {
                return acc + `<div class='card'><div class='card-body'><strong>${type}: </strong>${a.points[type]}</div></div>`;
            }, '<div class=\'card-columns\'>') + '</div>';
        } else {
            accountTab.querySelector('#points').innerHTML = '<h5>None</h5>';
        }

        const labels = ['defense', 'strength', 'speed', 'dexterity'];
        const values = labels.map(type => a.battleStats[type].value * 100 / a.battleStats.total);
        const max = (() => {
            const upperLimit= Math.max(...values);
            let n = 10;
            while (n < upperLimit) {
                n += 10;
            }
            return n
        })();
        const imageUrl = 'https://image-charts.com/chart?&cht=r&chxt=r&chxr=0,0,' + max +
            '&chs=400x400&chxl=0:|' + new Array(max / 5 + 1).fill(0).map((a, i) => i * 5 + '%').join('|') +
            '&chl=' + labels.map(a => a[0].toUpperCase() + a.slice(1)).join('|') +
            '&chd=t:' + [...values, values[values.length - 1]].join(',');
        accountTab.querySelector('#stats').appendChild(asElement('<img src=\'' + imageUrl + '\'></img>'))

        const elements = ['#point', '#stat'].map(a => accountTab.querySelector(a));
        let i = 0;
        setInterval(() => {
            i = (i + 1) % elements.length;
            elements[i].click();
        }, 5 * 1000);
    });
}
