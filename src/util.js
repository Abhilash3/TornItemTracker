import userInputTemplate from '../template/userInput.html';
import itemImportTemplate from '../template/itemImport.html';

// Opera 8.0+
var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

// Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';

// Safari 3.0+ "[object HTMLElementConstructor]"
var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
    return p.toString() === "[object SafariRemoteNotification]";
})(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

// Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;

// Edge 20+
var isEdge = !isIE && !!window.StyleMedia;

// Chrome 1+
var isChrome = !!window.chrome && !!window.chrome.webstore;

// Blink engine detection
var isBlink = (isChrome || isOpera) && !!window.CSS;

export function asElement(str) {
    let template = document.createElement('template');
    template.innerHTML = str.trim();
    return template.content.firstChild;
}

export const browser = {
    isBlink, isChrome, isEdge, isFirefox, isIE, isOpera, isSafari
};

export function fromClipboard() {
    return new Promise((resolve, reject) => {
        var userInput = this.asElement(userInputTemplate);
        var itemImport = this.asElement(itemImportTemplate);

        ['.modal-header', '.modal-footer'].forEach(selector => {
            var elem = userInput.querySelector(selector);
            elem.parentNode.removeChild(elem)
        });

        userInput.querySelector('.modal-body').appendChild(itemImport);

        var submit = itemImport.querySelector('#submit');
        var cancel = itemImport.querySelector('#cancel');
        var input = itemImport.querySelector('input');

        submit.addEventListener('click', () => {
            var value = input.value || '';
            document.body.removeChild(userInput);
            resolve(value.trim());
        });
        cancel.addEventListener('click', () => {
            document.body.removeChild(userInput);
            resolve('');
        });
        input.addEventListener('keyup', event => {
            if (event.keyCode === 13) submit.click();
            if (event.keyCode === 27) cancel.click();
        });

        document.body.appendChild(userInput);
        input.focus();
    });
}

export function toClipboard(string) {
    var textArea = document.createElement('textarea');
    textArea.setAttribute('style', 'width: 1px; border: 0; opacity: 0;');
    document.body.appendChild(textArea);
    textArea.value = string.trim();
    textArea.select();

    document.execCommand('copy');
    document.body.removeChild(textArea);
}

export function query(url) {
    return fetch(url).then(response => response.json()).catch(error => {
        console.log(error);
        throw error;
    });
}

export function toMap(arr, keyMapper = a => a, valueMapper = a => a) {
    return new Map(arr.map(a => [keyMapper(a), valueMapper(a)]));
}
