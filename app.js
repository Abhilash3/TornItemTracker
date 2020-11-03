const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const api = require('./src/api');

const app = express();
app.use(session({
    secret: ';ewjfb/.;d,fvd,fdsoaj;asfdlsfvefkbvdfn;vf;vjfnvbe;vfb;v',
    resave: false,
    saveUninitialized: false,
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const send = (res, name) => res.sendFile(`${__dirname}/public/html/${name}.html`);
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    return res.resirect('/app');
});
app.get('/login', (req, res) => {
	if (req.session.user) return res.redirect('/app');
	send(res, 'login');
}).post('/login', (req, res) => {
    const key = req.body.apiKey;
    api.items(key).then(a => {
        req.session.user = key;
        res.redirect('/app');
    });
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});
app.get('/app', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    send(res, 'index');
});
app.get('/items', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    api.items(req.session.user).then(a => res.json(a));
});
app.get('/inventory', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    api.inventory(req.session.user).then(a => res.json(a));
});
app.get('/prices/:itemId/:max', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const {itemId, max} = req.params;
    api.prices(req.session.user, itemId, max).then(a => res.json(a));
});

app.listen(3000, () => console.log('Express server listening on port 3000'));
