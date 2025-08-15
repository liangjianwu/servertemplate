const md5 = require('md5');
const crypto = require('crypto');  // Add this line
const { returnResult, returnError } = require('../components/errcode');
const { doWithTry } = require('../components/util');
const { User, UserProfile } = require('../models/Models');
const { body } = require('express-validator');
const EmailService = require('../services/EmailService');
const { generateCode } = require("../components/util");

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
module.exports.resetPassword = {
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
                const emailSent = await emailService.sendPasswordResetEmail(email, resetToken);
                
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
}
