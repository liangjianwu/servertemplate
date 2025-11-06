const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String, // JSON equivalent
        default: null
    },
    status: {
        type: Number,
        default: 0
    },
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpeciesRecognition',
        default: null
    },
    filename: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    }
});

const Image = mongoose.model('Image', imageSchema);

module.exports = { Image };