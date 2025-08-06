const { ErrorHint } = require("./console");
const { returnError } = require("./errcode");

module.exports.generateNumberCode = (length) => {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports.generateCode = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}


module.exports.getNextMonth = (date) => {
    Date.isLeapYear = function (year) { 
        return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)); 
    };
    
    Date.getDaysInMonth = function (year, month) {
        return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    };
    
    Date.prototype.isLeapYear = function () { 
        return Date.isLeapYear(this.getFullYear()); 
    };
    
    Date.prototype.getDaysInMonth = function () { 
        return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
    };
    
    Date.prototype.addMonths = function (value) {
        var n = this.getDate();
        this.setDate(1);
        this.setMonth(this.getMonth() + value);
        this.setDate(Math.min(n, this.getDaysInMonth()));
        return this;
    };
    let theDate = new Date(date)
    return Math.round(theDate.addMonths(1).getTime()/1000)
}

module.exports.decryptionString = (value,type)=>{
    if(!value||value==="") return value
    if(type === 'email') {
        let tt = value.split('@')
        return tt[0].substring(0,3)+'***@' + (tt[1]?tt[1]:"")
    }else {
        return value.substring(0,3)+'***' + value.substring(value.length-3)
    }
}

module.exports.addressCombine = (address,city,province,country,postcode) =>{
    let ret = ''
    ret += address ? address:''
    ret += city ? (ret.length>0?(', '+city):city):''
    ret += province ? (ret.length>0?(', '+province):province):''    
    ret += country ? (ret.length>0?(', '+country):country):''
    ret += postcode ? (ret.length>0?(', '+postcode):postcode):''
    return ret
    
}

module.exports.doWithTry = async (res,callback)=>{
    try {
        await callback()
    }catch(e){
        ErrorHint(e)
        return returnError(res, 900001)
    }
}