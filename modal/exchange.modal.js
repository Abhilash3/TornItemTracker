const mongoose = require('mongoose');

const Exchange = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true,
    },
    items: [{
        id: {
            type: Number,
            required: true,
        },
        count: {
            type: Number,
            default: 1,
        },
    }],
    points: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model('exchange', Exchange);
