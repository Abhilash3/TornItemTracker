const mongoose = require('mongoose');

const Exchange = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
    },
    items: [{
        type: Number,
    }],
    points: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model('exchange', Exchange);
