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
        default: false,
    },
});

module.exports = mongoose.model('user', User);
