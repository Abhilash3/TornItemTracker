const mongoose = require('mongoose');

const Query = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    text: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        required: true,
        unique: true
    },
});

module.exports = mongoose.model('query', Query);
