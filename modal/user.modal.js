const mongoose = require('mongoose');
const localMongoose = require('passport-local-mongoose');

const {DB_USER, DB_HOST, DB_PASSWORD, DB_NAME} = process.env;
mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => console.log('Mongoose connection open'));
mongoose.connection.on('error', err => console.log('Mongoose connection error: ' + err)); 
mongoose.connection.on('disconnected', () => console.log('Mongoose connection disconnected'));

process.on('SIGINT', () => mongoose.connection.close(() => { 
    console.log('Mongoose connection disconnected through app termination'); 
    process.exit(0); 
}));

const User = new mongoose.Schema({
    username: {
        type: 'string',
        unique: true,
        required: true,
        index: true,
    },
});

User.plugin(localMongoose);
module.exports = mongoose.model('user', User);