const colors = require('colors/safe');

module.exports.Debug = (msg)=>{
    console.debug(colors.green(msg))
}

module.exports.Log = (msg)=>{
    console.log(colors.white(msg))
}

module.exports.Hint = (msg)=>{
    console.warn(colors.yellow(msg))
}

module.exports.ErrorHint = (msg)=>{
    console.error(colors.red(msg))
}
