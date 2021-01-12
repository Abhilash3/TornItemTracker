require('dotenv').config();

const bodyParser = require('body-parser');
const connectMongo = require('connect-mongo');
const cookieParser = require('cookie-parser');
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const {Strategy} = require('passport-custom');
const {ensureLoggedIn} = require('connect-ensure-login');

const mongoose = require('./modal/mongoose');

const Exchange = require('./modal/exchange.modal');
const User = require('./modal/user.modal');
const api = require('./js/api');

const app = express();

const MongoStore = connectMongo(session);
app.use(session({
    maxAge: 24 * 60 * 60 * 1000,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({mongooseConnection: mongoose.connection}),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

passport.use('torn', new Strategy(({body: {apiKey}}, done) => {
    api.basic(apiKey).then(({error, player_id: userId, name: username}) => {
        if (error) return done(error);
        User.findOne({userId}, (err, user) => {
            if (err || user) return done(err, user);
            User.create({username, userId}, done);
        });
    });
}));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const sendView = (res, name) => res.sendFile(`${__dirname}/public/${name}.html`);
const sendError = (res, err) => res.status(400).json({error: err});
const sendJson = (res, p) => p.then(a => res.json(a));

app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => {
    if (req.session.key) return res.redirect('/app');
    sendView(res, 'login');
});
app.post('/login', (req, res, next) => {
    passport.authenticate('torn', (err, user) => {
        if (err) return sendError(res, err);
        if (!user) return res.redirect('/login');
        req.logIn(user, err => {
            if (err) return sendError(res, err);
            req.session.user = user;
            req.session.key = req.body.apiKey;
            res.redirect('/app');
        });
    })(req, res, next);
});
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

app.get('/app', ensureLoggedIn(), (req, res) => sendView(res, 'index'));
app.get('/items', ensureLoggedIn(), (req, res) => sendJson(res, api.items(req.session.key)));
app.get('/inventory', ensureLoggedIn(), (req, res) => sendJson(res, api.inventory(req.session.key)));
app.get('/prices/:max/:item', ensureLoggedIn(), (req, res) => sendJson(res, api.prices(req.session.key, req.params.item, req.params.max)));
app.get('/account', ensureLoggedIn(), (req, res) => res.json(req.session.user));
app.get('/details', ensureLoggedIn(), (req, res) => sendJson(res, api.details(req.session.key)));
app.get('/exchanges', ensureLoggedIn(), (req, res) => Exchange.find({}, (err, doc) => {
    if (err) return sendError(res, err);
    res.json(doc);
}));

app.post('/update', ensureLoggedIn(), (req, res) => User.findOneAndUpdate({userId: req.session.user.userId}, req.body, (err, doc) => {
    if (err) return sendError(res, err);
    session.user = doc;
    res.status(200).send();
}));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Express server listening on port ' + port));
