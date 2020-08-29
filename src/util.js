import userInputTemplate from '../template/userInput.html';
import itemImportTemplate from '../template/itemImport.html';

export function asElement(str) {
    const template = document.createElement('template');
    template.innerHTML = str.trim();
    return template.content.firstChild;
}

export function asDoller(value) {
    const floored = Math.floor(value);
    const formatted = String(floored).split('').reverse()
        .reduce((acc, n, i) => acc + (i > 0 && i % 3 === 0 ? ',' : '') + n, '')
        .split('').reverse().join('');
    return '$' + formatted + (value != floored ? (value - floored).toFixed(2).substring(1) : '');
}

export function fire(url) {
    return fetch(url).then(response => response.json()).catch(error => {
        console.log(error);
        throw error;
    });
}

export const fromClipboard = (() => {
    const userInput = asElement(userInputTemplate);
    const itemImport = asElement(itemImportTemplate);

    ['.modal-header', '.modal-footer']
        .map(selector => userInput.querySelector(selector))
        .forEach(elem => elem.parentNode.removeChild(elem));

    userInput.querySelector('.modal-body').appendChild(itemImport);

    let submit = itemImport.querySelector('#submit');
    let cancel = itemImport.querySelector('#cancel');
    const input = itemImport.querySelector('input');

    input.addEventListener('keyup', ({keyCode}) => {
        if (keyCode === 13) submit.click();
        if (keyCode === 27) cancel.click();
    });

    return () => {
        return new Promise(resolve => {
            const handle = value => {
                document.body.removeChild(userInput);
                resolve(value);

                const newSubmit = submit.cloneNode(true);
                submit.parentNode.replaceChild(newSubmit, submit);
                submit = newSubmit;

                const newCancel = cancel.cloneNode(true);
                cancel.parentNode.replaceChild(newCancel, cancel);
                cancel = newCancel;
            };
            cancel.addEventListener('click', () => handle(''));
            submit.addEventListener('click', () => handle((input.value || '').trim()));

            input.value = '';
            document.body.appendChild(userInput);
            input.focus();
        });
    };
})();

export function randomColor() {
    const col = () => Math.floor(Math.random() * 255);
    return `rgb(${col()},${col()},${col()})`;
}

export function toClipboard(string) {
    const textArea = document.createElement('textarea');
    textArea.setAttribute('style', 'width: 1px; border: 0; opacity: 0;');
    document.body.appendChild(textArea);
    textArea.value = string;
    textArea.select();

    document.execCommand('copy');
    document.body.removeChild(textArea);
}

export const toMap = (arr, idfier = a => a, mapper = a => a) => new Map(arr.map(a => [idfier(a), mapper(a)]));
