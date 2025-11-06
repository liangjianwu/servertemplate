const mongoose = require('mongoose');

const speciesRecognitionSchema = new mongoose.Schema({
    imageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
        required: true
    },
    name: {
        common: {
            type: String,
            default: null
        },
        scientific: {
            type: String,
            default: null
        }
    },
    family: {
        type: String,
        default: null
    },
    kingdom: {
        type: String, // Plantae, Animalia, Fungi, etc.
        default: null
    },
    speciesType: {
        type: String, // plant, animal, fungi, bacteria, etc.
        default: null
    },
    funFacts: [{
        type: String
    }],
    facts: [{
        type: String
    }],
    habitat: {
        type: String, // Changed from 'area' to 'habitat' for broader applicability
        default: null
    },
    conservation: {
        type: String, // Conservation status if applicable
        default: null
    },
    confidence: {
        type: Number,
        default: null
    },
    rawResponse: {
        type: String, // Store the raw OpenAI response for debugging
        default: null
    },
    processedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const SpeciesRecognition = mongoose.model('SpeciesRecognition', speciesRecognitionSchema);

module.exports = { SpeciesRecognition };