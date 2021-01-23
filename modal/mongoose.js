require('./exchange.modal');
require('./query.modal');
require('./user.modal');
const mongoose = require('mongoose');

const {DB_USER, DB_HOST, DB_PASSWORD, DB_NAME} = process.env;
mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

mongoose.connection.on('connected', () => console.log('Mongoose connection open'));
mongoose.connection.on('error', err => console.log('Mongoose connection error: ' + err));
mongoose.connection.on('disconnected', () => console.log('Mongoose connection disconnected'));

process.on('SIGINT', () => mongoose.connection.close(() => {
    console.log('Mongoose connection disconnected through app termination');
    process.exit(0);
}));

module.exports = mongoose;
