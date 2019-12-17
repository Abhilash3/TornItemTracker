import userInputTemplate from '../template/userInput.html';
import itemImportTemplate from '../template/itemImport.html';

// Opera 8.0+
const isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

// Firefox 1.0+
const isFirefox = typeof InstallTrigger !== 'undefined';

// Safari 3.0+ "[object HTMLElementConstructor]"
const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
    return p.toString() === "[object SafariRemoteNotification]";
})(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

// Internet Explorer 6-11
const isIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+
const isEdge = !isIE && !!window.StyleMedia;

// Chrome 1+
const isChrome = !!window.chrome && !!window.chrome.webstore;

// Blink engine detection
const isBlink = (isChrome || isOpera) && !!window.CSS;

export function asElement(str) {
    const template = document.createElement('template');
    template.innerHTML = str.trim();
    return template.content.firstChild;
}

export const browser = {
    isBlink, isChrome, isEdge, isFirefox, isIE, isOpera, isSafari
};

export function fire(url) {
    return fetch(url).then(response => response.json()).catch(error => {
        console.log(error);
        throw error;
    });
}

export function fromClipboard() {
    return new Promise(resolve => {
        const userInput = asElement(userInputTemplate);
        const itemImport = asElement(itemImportTemplate);

        ['.modal-header', '.modal-footer'].forEach(selector => {
            const elem = userInput.querySelector(selector);
            elem.parentNode.removeChild(elem)
        });

        userInput.querySelector('.modal-body').appendChild(itemImport);

        const submit = itemImport.querySelector('#submit');
        const cancel = itemImport.querySelector('#cancel');
        const input = itemImport.querySelector('input');

        submit.addEventListener('click', () => {
            const value = input.value || '';
            document.body.removeChild(userInput);
            resolve(value.trim());
        });
        cancel.addEventListener('click', () => {
            document.body.removeChild(userInput);
            resolve('');
        });
        input.addEventListener('keyup', ({keyCode}) => {
            if (keyCode === 13) submit.click();
            if (keyCode === 27) cancel.click();
        });

        document.body.appendChild(userInput);
        input.focus();
    });
}

export function randomColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgb(${r},${g},${b})`;
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

export function toMap(arr, keyMapper = a => a, valueMapper = a => a) {
    return new Map(arr.map(a => [keyMapper(a), valueMapper(a)]));
}
