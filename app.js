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
app.use(express.static(__dirname + '/public/build'));

const send = (res, name) => res.sendFile(`${__dirname}/public/html/${name}.html`);
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    return res.redirect('/app');
});
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/app');
    send(res, 'login');
}).post('/login', (req, res) => {
    const key = req.body.apiKey;
    api.basic(key).then(a => {
        if (a.error) return res.status(424).json(a.error);
        req.session.user = a;
        req.session.key = key;
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
    api.items(req.session.key).then(a => res.json(a));
});
app.get('/inventory', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    api.inventory(req.session.key).then(a => res.json(a));
});
app.get('/prices/:max/:itemId', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const {itemId, max} = req.params;
    api.prices(req.session.key, itemId, max).then(a => res.json(a));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Express server listening on port ' + port));
