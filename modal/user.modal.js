const mongoose = require('mongoose');

const User = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        unique: true,
        required: true,
        index: true,
    },
    notify: {
        type: Boolean,
        default: true,
    },
    created: {
        type: Date,
        required: true,
        unique: true
    },
});

module.exports = mongoose.model('user', User);
