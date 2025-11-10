const md5 = require('md5');
const crypto = require('crypto');
const { returnResult, returnError } = require('../components/errcode');
const { doWithTry } = require('../components/util');
const { User, UserProfile } = require('../models/UserModels');
const { body } = require('express-validator');
const EmailService = require('../services/EmailService');
const { generateCode } = require("../components/util");
const { OAuth2Client } = require('google-auth-library');
const AppleSignIn = require('apple-signin-auth');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports.register = {
    // Register new user
    post: [
        [
            body('email').isEmail().withMessage('Invalid email format'),
            body('passwd').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
            body('nick').optional().isString().isLength({ max: 255 }).withMessage('Nickname too long'),
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                const { email, passwd, nick } = req.body;
                
                // Check if user already exists
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return returnError(res, 900001, 'Email already registered');
                }

                // Create new user
                const user = new User({
                    email,
                    passwd: md5(passwd),
                    status: 1, // Active status
                    nick: nick || null,
                    token: null,
                    ua: req.headers['user-agent'],
                    ip: req.ip
                });

                const savedUser = await user.save();
                await EmailService.sendWelcomeEmail(savedUser.email, savedUser.nick);

                // Create user profile
                const userProfile = new UserProfile({
                    user_id: savedUser._id,
                    avatar: null,
                    bio: null,
                    display: null
                });
                await userProfile.save();

                // Don't send password in response
                const userResponse = {
                    id: savedUser._id,
                    email: savedUser.email,
                    nick: savedUser.nick,
                    status: savedUser.status
                };

                return returnResult(res, userResponse);
            });
        }
    ],
}

    // User signin
module.exports.signin = {
    post: [
        [
            body('email').isEmail().withMessage('Invalid email format'),
            body('passwd').isString().notEmpty().withMessage('Password is required'),
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                const { email, passwd } = req.body;
                const timestamp = Date.now();
                
                // Find user by email
                const user = await User.findOne({ email });
                if (!user) {
                    return returnError(res, 900002, 'Invalid email or password');
                }

                // Check password
                if (user.passwd !== md5(passwd)) {
                    return returnError(res, 900002, 'Invalid email or password');
                }

                // Check if user is active
                if (user.status !== 1) {
                    return returnError(res, 900003, 'Account is not active');
                }

                const ua = req.headers['user-agent'];
                const ip = req.ip;

                // Generate token using all required fields
                const tokenData = `${ua}${ip}${email}${passwd}${timestamp}`;
                const token = md5(tokenData);
                const expiry_time = new Date(timestamp + 30 * 24 * 60 * 60 * 1000);

                // Update user with new token and expiry
                user.token = token;
                user.expiry_time = expiry_time;
                user.ua = ua;
                user.ip = ip;
                await user.save();

                // Return user data with token
                const userResponse = {
                    uid: user._id,
                    status: user.status,
                    token: token,
                    expiry_time: expiry_time
                };

                return returnResult(res, userResponse);
            });
        }
    ]
};

// Add forgot password functionality
module.exports.resetpassword = {
    post: [
        [
            body('email').isEmail().withMessage('Invalid email format'),
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                const { email } = req.body;
                const user = await User.findOne({ email });
                
                if (!user) {
                    return returnError(res, 900002, 'Email not found');
                }

                // Generate reset token
                const resetToken = generateCode(6);
                const resetExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

                // Update user+
                user.reset_token = resetToken;
                user.reset_token_expires = resetExpiry;
                await user.save();

                // Send email
                const emailSent = await EmailService.sendPasswordResetEmail(email, resetToken);
                
                if (!emailSent) {
                    return returnError(res, 900005, 'Failed to send reset email');
                }

                return returnResult(res, {
                    message: 'Password reset instructions sent to email'
                });
            });
        }
    ]
};

// Verify reset code and update password
module.exports.confirmreset = {
    post: [
        [
            body('email').isEmail().withMessage('Invalid email format'),
            body('code').isString().isLength({ min: 6, max: 6 }).withMessage('Invalid reset code'),
            body('newPassword').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                const { email, code, newPassword } = req.body;
                
                // Find user by email
                const user = await User.findOne({ email });
                
                if (!user) {
                    return returnError(res, 900006, 'Email not found');
                }

                // Check if reset token exists
                if (!user.reset_token || !user.reset_token_expires) {
                    return returnError(res, 900007, 'No password reset request found');
                }

                // Check if token has expired
                if (new Date() > user.reset_token_expires) {
                    return returnError(res, 900008, 'Reset code has expired');
                }

                // Verify reset code
                if (user.reset_token !== code) {
                    return returnError(res, 900009, 'Invalid reset code');
                }

                // Update password
                user.passwd = md5(newPassword);
                user.reset_token = null;
                user.reset_token_expires = null;
                
                // Invalidate existing session token for security
                user.token = null;
                user.expiry_time = null;
                
                await user.save();

                return returnResult(res, {
                    message: 'Password reset successfully. Please sign in with your new password.'
                });
            });
        }
    ]
};
module.exports.changeProfile = {
    // Set or update user bio
    post: [
        [
            body('uid').isMongoId().withMessage('Invalid user ID'),
            body('bio').optional().isString().isLength({ max: 500 }).withMessage('Bio too long'),
            body('avatar').optional().isString().isLength({ max: 500 }).withMessage('Invalid avatar URL'),
            body('display').optional().isJSON().withMessage('Invalid display format')
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                const { uid, bio, avatar, display } = req.body;

                // Find user profile
                let userProfile = await UserProfile.findOne({ user_id: uid });
                if (!userProfile) {
                    return returnError(res, 900004, 'User profile not found');
                }

                // Update bio
                userProfile.bio = bio || userProfile.bio;
                userProfile.avatar = avatar || userProfile.avatar;
                userProfile.display = display || userProfile.display;
                await userProfile.save();

                return returnResult(res, { message: 'Profile updated successfully' });
            });
        }
    ]
};

// Add OAuth routes
module.exports.googleauth = {
    post: [
        [
            body('token').isString().notEmpty().withMessage('Google token is required'),
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                console.log('Google Auth Token:', req.body.token);
                const { token } = req.body;

                try {
                    // Verify Google token
                    const ticket = await googleClient.verifyIdToken({
                        idToken: token,
                        audience: process.env.GOOGLE_CLIENT_ID
                    });

                    const payload = ticket.getPayload();
                    
                    // Google token payload contains all these fields:
                    const {
                        email,          // User's email address
                        email_verified, // Boolean
                        name,           // Full name
                        given_name,     // First name
                        family_name,    // Last name
                        picture,        // Profile picture URL
                        locale,         // User's locale
                        sub: googleId   // Unique Google ID
                    } = payload;

                    // Verify email is validated by Google
                    if (!email_verified) {
                        return returnError(res, 900016, 'Email not verified with Google');
                    }

                    // Check if user exists
                    let user = await User.findOne({ 
                        $or: [
                            { email },
                            { google_id: googleId }
                        ] 
                    });

                    if (!user) {
                        // Create new user using Google profile data
                        user = new User({
                            email,
                            nick: name || email.split('@')[0],
                            first_name: given_name || '',
                            last_name: family_name || '',
                            status: 1,
                            google_id: googleId,
                            passwd: md5(crypto.randomBytes(16).toString('hex'))
                        });

                        await user.save();

                        // Create user profile
                        const userProfile = new UserProfile({
                            user_id: user._id,
                            avatar: picture,
                            bio: null,
                            display: name,
                            locale: locale
                        });
                        await userProfile.save();
                    }

                    // Generate authentication token
                    const authToken = md5(user._id + Date.now().toString());
                    const expiry_time = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                    // Update user session
                    user.token = authToken;
                    user.expiry_time = expiry_time;
                    user.ua = req.headers['user-agent'];
                    user.ip = req.ip;
                    await user.save();

                    return returnResult(res, {
                        uid: user._id,
                        status: user.status,
                        token: authToken,
                        expiry_time: expiry_time
                    });

                } catch (error) {
                    console.error('Google token verification failed:', error);
                    return returnError(res, 900014, 'Invalid Google token');
                }
            });
        }
    ]
};

module.exports.appleauth = {
    post: [
        [
            body('token').isString().notEmpty().withMessage('Apple ID token is required'),
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                const { token } = req.body;

                try {
                    // Verify Apple token
                    const appleResponse = await AppleSignIn.verifyIdToken(token, {
                        audience: process.env.APPLE_CLIENT_ID,
                        ignoreExpiration: false,
                    });

                    const { email, sub: appleId } = appleResponse;
                    
                    // Check if user exists
                    let user = await User.findOne({ 
                        $or: [
                            { email },
                            { apple_id: appleId }
                        ]
                    });

                    if (!user) {
                        // Create new user
                        user = new User({
                            email,
                            nick: email.split('@')[0], // Use email prefix as nickname
                            status: 1,
                            apple_id: appleId,
                            passwd: md5(crypto.randomBytes(16).toString('hex'))
                        });

                        await user.save();

                        // Create user profile
                        const userProfile = new UserProfile({
                            user_id: user._id,
                            avatar: null,
                            bio: null,
                            display: null
                        });
                        await userProfile.save();
                    }

                    // Generate authentication token
                    const authToken = md5(user._id + Date.now().toString());
                    const expiry_time = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                    // Update user session
                    user.token = authToken;
                    user.expiry_time = expiry_time;
                    user.ua = req.headers['user-agent'];
                    user.ip = req.ip;
                    await user.save();

                    return returnResult(res, {
                        uid: user._id,
                        status: user.status,
                        token: authToken,
                        expiry_time: expiry_time
                    });

                } catch (error) {
                    console.error('Apple token verification failed:', error);
                    return returnError(res, 900024, 'Invalid Apple token');
                }
            });
        }
    ]
};
