const { returnError } = require("../components/errcode")
const { doWithTry } = require("../components/util")
const { resetpassword, confirmreset, signin, register, googleauth, appleauth } = require("../controllers/UserCtrl")
const { User } = require("../models/UserModels")
const md5 = require('md5')
const passPath = {
    user: {
        register: ['POST'],
        signin: ['POST'],
        googleauth: ['POST'],
        appleauth: ['POST'],
        resetpassword: ['POST'],
        confirmreset: ['POST'],
    },
}

const checkAuth = async (req, res, callback) => {
    doWithTry(res, async () => {
        let path = req.path
        let method = req.method
        let idx = ['POST', 'GET', 'DELETE', 'PUT'].indexOf(method)
        let user = await User.findOne({ _id: req.uid })
        if (!user || user.status != 1 || user.token != req.token || user.token_expiry < Date.now()) {
            return returnError(res, 900004, 'Unauthorized')
        }
        return callback(req, res)

    })
}

const auth = async (req, res, callback) => {
    return checkAuth(req, res, callback)
}

const authRouter = async (req, res, next) => {

    let paths = req.path.split('/')
    if (paths.length < 3) {
        return returnError(res, 900000)
    }
    req.req_action = paths[paths.length - 1];
    req.req_component = paths[paths.length - 2];
    req.requestUa = req.get('User-Agent')
    req.requestIp = req.headers['X-Real_IP'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    req.requestDevice = md5(req.reuestUa + req.requesetIp)

    req.uid = req.headers['request-userid'];
    req.token = req.headers['request-token'];
    req.time = req.headers['request-time'];

    if (passPath[req.req_component] && passPath[req.req_component][req.req_action] && passPath[req.req_component][req.req_action].includes(req.method)) {
        next()
    } else {
        // recordSysLog(res,req,req.method,req.path,['GET','DELETE'].indexOf(req.method)>=0 ?JSON.stringify(req.query):JSON.stringify(req.body),1)
        auth(req, res, (req, res) => {
            next()
        })
    }

}

module.exports = { authRouter, auth }

