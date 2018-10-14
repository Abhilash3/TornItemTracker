define(['text!../template/userInput.html'], userInputTemplate => {

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

    return {
        asElement(str) {
            let template = document.createElement('template');
            template.innerHTML = str.trim();
            return template.content.firstChild;
        },

        browser: {
            isBlink, isChrome, isEdge, isFirefox, isIE, isOpera, isSafari
        },

        fromClipboard() {
            return new Promise((resolve, reject) => {
                var userInput = this.asElement(userInputTemplate);
                userInput.querySelector('#submit').addEventListener('click', event => {
                    var value = userInput.querySelector('input').value || '';
                    document.body.removeChild(userInput);
                    resolve(value.trim());
                });
                userInput.querySelector('#cancel').addEventListener('click', event => {
                    document.body.removeChild(userInput);
                    resolve('');
                });

                document.body.appendChild(userInput);
            });
        },

        toClipboard(string) {
            var textArea = document.createElement('textarea');
            textArea.setAttribute('style', 'width: 1px; border: 0; opacity: 0;');
            document.body.appendChild(textArea);
            textArea.value = string.trim();
            textArea.select();

            document.execCommand('copy');
            document.body.removeChild(textArea);
        },

        query(url) {
            return fetch(url).then(response => response.json()).catch(error => {
                console.log(error);
                throw error;
            });
        },

        toMap(arr, keyMapper = a => a, valueMapper = a => a) {
            return new Map(arr.map(a => [keyMapper(a), valueMapper(a)]));
        }
    };
});
