require('dotenv').config();

const bodyParser = require('body-parser');
const connectMongo = require('connect-mongo');
const cookieParser = require('cookie-parser');
const ensureLogin = require('connect-ensure-login');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');

const User = require('./modal/user.modal');
const api = require('./js/api');

const app = express();

const MongoStore = connectMongo(session);
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection}),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const send = (res, name) => res.sendFile(`${__dirname}/client/html/${name}.html`);
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    return res.redirect('/app');
});
app.get('/register', (req, res) => send(res, 'register')).post('/register', (req, res) => {
    const {username, password} = req.body;
    User.register({username}, password, (err, user) => {
        if (err) return res.status(400).json({error: err});
        res.redirect('/login');
    });
});
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/app');
    send(res, 'login');
}).post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user) => {
        if (err) return res.status(400).json({error: err});
        if (!user) return res.redirect('/login');
        req.logIn(user, err => {
            if (err) return res.status(400).json({error: err});
            const {apiKey} = req.body;
            api.basic(apiKey).then(a => {
                if (a.error) return res.status(424).json(a.error);
                req.session.user = a;
                req.session.key = apiKey;
                res.redirect('/app');
            });
        });
    })(req, res, next);
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/app', ensureLogin.ensureLoggedIn(), (req, res) => send(res, 'index'));
app.get('/items', ensureLogin.ensureLoggedIn(), (req, res) => api.items(req.session.key).then(a => res.json(a)));
app.get('/inventory', ensureLogin.ensureLoggedIn(), (req, res) => api.inventory(req.session.key).then(a => res.json(a)));
app.get('/prices/:max/:itemId', ensureLogin.ensureLoggedIn(), (req, res) => api.prices(req.session.key, req.params.itemId, req.params.max).then(a => res.json(a)));
app.get('/account', ensureLogin.ensureLoggedIn(), (req, res) => res.json(req.session.user));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Express server listening on port ' + port));
