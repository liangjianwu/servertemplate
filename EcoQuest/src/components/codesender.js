const {Hint,Debug} = require('./console')

module.exports.sendSmsCode = (country,prefix,phone,code) => {
    Hint("the sendSmsCode did nothing")
    return true
}

module.exports.sendEmailCode = (email,firstname,lastname,type,code) => {
    Hint("the sendEmailCode did nothing")
    return true
}
