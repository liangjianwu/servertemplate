const e = require('express');
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    username: { type: String,required: true},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    description: { type: String, required: false},
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', itemSchema);
