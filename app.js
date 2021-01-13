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

app.use('/js', [ensureLoggedIn(), express.static(__dirname + '/public/js')]);
app.use('/css', express.static(__dirname + '/public/css'));

passport.use('torn', new Strategy((req, done) => api.basic(req.body.apiKey).then(data => {
    if (data.error) return done(data.error);
    User.findOne({userId: data.player_id}, (err, user) => {
        if (err || user) return done(err, user);
        User.create({username: data.name, userId: data.player_id, created: new Date()}, done);
    });
})));
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const sendView = (res, name) => res.sendFile(`${__dirname}/public/${name}.html`);
const sendError = (res, err) => res.status(400).json({error: err});
const sendJson = (res, p) => p.then(a => res.json(a));

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

app.get('/app', ensureLoggedIn(), (req, res) => sendView(res, 'app'));
app.get('/items', ensureLoggedIn(), (req, res) => sendJson(res, api.items(req.session.key)));
app.get('/inventory', ensureLoggedIn(), (req, res) => sendJson(res, api.inventory(req.session.key)));
app.get('/prices/:max/:item', ensureLoggedIn(), ({session: {key}, params: {item, max}}, res) => sendJson(res, api.prices(key, item, max)));
app.get('/account', ensureLoggedIn(), (req, res) => res.json(req.session.user));
app.get('/details', ensureLoggedIn(), (req, res) => sendJson(res, api.details(req.session.key)));
app.get('/exchanges', ensureLoggedIn(), (req, res) => Exchange.find({}, (err, doc) => {
    if (err) return sendError(res, err);
    res.json(doc);
}));

app.post('/update', ensureLoggedIn(), (req, res) => User.findOneAndUpdate({userId: req.session.user.userId}, req.body, (err, doc) => {
    if (err) return sendError(res, err);
    req.session.user = doc;
    res.status(200).send();
}));
app.get('*', (req, res) => res.redirect('/login'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Express server listening on port ' + port));
