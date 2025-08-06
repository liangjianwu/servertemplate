const md5 = require('md5');
const { returnResult, returnError } = require('../components/errcode');
const { doWithTry } = require('../components/util');
const User = require('../models/User');
const { body, query } = require('express-validator')

module.exports.users = {
    get: async (req, res) => {
        try {
            const items = await User.find();
            return returnResult(res,items);
        } catch (error) {
            return returnError(res,900000,error.message);
        }
    }
}

module.exports.user = {
    post: [
        [
            body('username').isString().notEmpty().isLength({min:3,max:20}).withMessage('Username is required'),
            body('email').isEmail().withMessage('Invalid email format'),
            body('password').isString().isMD5().withMessage('Password must be at least 6 characters long'),            
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                let {username, email, password} = req.body;
                const item = new User({username, email,password: md5(password)});
                const savedUser = await item.save();
                return returnResult(res,savedUser);                
            })
        }
    ],
    put: [
        [
            body('id').exists().withMessage('User ID is required'),
            body('username').optional().isString().notEmpty().isLength({min:3,max:20}).withMessage('Username is required'),            
            body('password').optional().isString().isMD5().withMessage('Password must be at least 6 characters long'),            
        ],
        async (req, res) => {
            doWithTry(res, async () => {
                let {username, id, password} = req.body;
                try {
                    const updatedUser = await User.findByIdAndUpdate(id, {username, password: md5(password)}, { new: true });
                    if (!updatedUser) {
                        return returnError(res,900000,'User not found');
                    }
                    return returnResult(res,updatedUser);
                } catch (error) {
                    return returnError(res,900000,error.message);
                }
            })
        }
    ],

}
