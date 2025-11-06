require('dotenv').config();

module.exports = {
    google: {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback'
    },
    apple: {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        callbackURL: '/auth/apple/callback',
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH
    }
};