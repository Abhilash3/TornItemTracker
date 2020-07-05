const OPERATORS = (() => {
    const OPERATORS = {};
    OPERATORS[':'] = (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase());
    OPERATORS['='] = (a, b) => Number(a) === Number(b);
    OPERATORS['>'] = (a, b) => Number(a) > Number(b);
    OPERATORS['<'] = (a, b) => Number(a) < Number(b);
    OPERATORS['!:'] = (a, b) => !OPERATORS[':'](a, b);
    OPERATORS['!='] = (a, b) => !OPERATORS['='](a, b);
    OPERATORS['>='] = (a, b) => !OPERATORS['<'](a, b);
    OPERATORS['<='] = (a, b) => !OPERATORS['>'](a, b);

    return new Proxy(OPERATORS, {get: (a, b) => b in a ? a[b] : () => false});
})();
const OPERATOR_TYPES = Object.keys(OPERATORS).sort((a, b) => b.length - a.length);

function createQuery(string) {
    let operator = OPERATOR_TYPES.find(type => string.includes(type));
	if (!operator) {
		operator = ':';
		string = `name:${string}`;
	}
	const [prop, value] = string.split(operator).map(a => a.trim());
    return (item) => OPERATORS[operator](item[prop], value);
}

const wrap = (queries, wrapper) => queries.length > 1 ? wrapper(queries) : queries[0];
const wrapAnd = (queries) => wrap(queries, a => (item) => a.every(b => b(item)));
const wrapOr = (queries) => wrap(queries, a => (item) => a.some(b => b(item)));

function closingTag(string, start) {
    let count = 1, i = start + 1;
    for (; i < string.length; i++) {
        if (string[i] === '(') count++;
        if (string[i] === ')') count--;
        if (count === 0) break;
    }
    return i;
}

const IGNORED_CHARS = {')': true, '|': true};

export function parseQuery(string) {
    if (string.length === 0) return () => true;
    const andLoc = string.indexOf('&'), orLoc = string.indexOf('|');
    if (orLoc === 0 || andLoc === 0 || orLoc === string.length - 1 || andLoc === string.length - 1) return () => false;

    const input = string.split(' ').map(a => a.trim()).filter(a => a).join(' ');
    const items = [];
    Object.defineProperty(items, 'last', {get: () => items[items.length - 1]});
    Object.defineProperty(items, 'secLast', {get: () => items[items.length - 2]});
    
    for (let i = 0; i < input.length; i++) {
        if (IGNORED_CHARS[input[i]]) continue;
        
        if (input[i] === '&') {
            if (items.last != '&') items.push(input[i]);
            continue;
        }

        let end, query;
        if (input[i] === '(') {
            end = closingTag(input, i);
            query = [parseQuery(input.substring(i + 1, end))];
        } else if (input[i] !== ' ') {
            end = (input + ' ').indexOf(' ', i + 1);
            query = [createQuery(input.substring(i, end))];
        }
        if (!query) continue;

        if (items.length && items.last === '&') {
            query = [...items.secLast, query[0]];
            items.length = items.length - 2;
        }
        items.push(query);
        i = end;
    }

    return wrapOr(items.map(wrapAnd));
}
