const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');

        mongoose.connection.on('error', err => {
            console.error('MongoDB error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;