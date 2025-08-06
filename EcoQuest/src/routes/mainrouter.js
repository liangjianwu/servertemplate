const express = require('express')
const fs = require('fs');
const { validationResult } = require("express-validator")
const { Debug } = require('../components');

const getValidatorErrorResult = (errors)=>{
    for(let i in errors) {
        let err = errors[i]
        if(err.param == "_error") {
            let pp = false
            let pa = []
            for(let j in err.nestedErrors) {
                let err1 = err.nestedErrors[j]
                pa.push(err1.param)
                if(err1.value) {
                    pp = true
                    err.param = err1.param
                    err.value = err1.value
                    err.msg = err1.msg
                    break
                }
            }
            if(!pp) {
                err.param = pa
                err.value = 'no value'
                err.msg = 'no value'
            }
        }
    }
    return {success:false,data:{errcode:990000,errors:errors}}
}
const checkValidateRouter = (req,res,action) =>{
    const errors = validationResult(req); 
    if (!errors.isEmpty()) {
        return res.status(209).json(getValidatorErrorResult(errors.array()));
    }
    return action(req,res)
}

let controllers = fs.readdirSync(__dirname + '/../controllers');
let ctrl_files = controllers.filter((f) => {
    return f.endsWith('.js');
}, controllers);

module.exports.routers = [];

for (let f of ctrl_files) {        
    let modulename = f.substring(0, f.length - 7).toLowerCase(); 
    Debug("Load router:" + modulename)
    let c = require(__dirname + '/../controllers/' + f);
    let v = fs.existsSync(__dirname + '/../controllers/validate/' + modulename+'.js')?
                    require(__dirname + '/../controllers/validate/' + modulename):undefined;
    let m = {
        module:modulename,
        router:express.Router()
    }
    module.exports.routers.push(m)
    let ckeys = Object.keys(c)
    
    for(let k of ckeys) {
        Debug("Load action:" + k)
        if(typeof c[k] == 'function') {
            let vv = v ? (v.validate(k) != undefined ? v.validate(k):v.validate(k+'.post')):undefined
            vv != undefined ? m.router.post('/'+k.toLowerCase(),vv,(req,res)=>{
                checkValidateRouter(req,res,c[k])
            }):m.router.post('/'+k.toLowerCase(),c[k])
        }else if(typeof c[k] == 'object' && !Array.isArray(c[k])) {
            let methods = Object.keys(c[k])
            for( let method of methods ) {                   
                let vv = v ? v.validate(k+'.'+method):undefined                
                let func = c[k][method]
                if( typeof c[k][method] == 'object' && Array.isArray(c[k][method])) {
                    vv = c[k][method][0]
                    func = c[k][method][1]
                }
                vv != undefined ? m.router[method]('/'+k.toLowerCase(),vv,(req,res)=>{
                    checkValidateRouter(req,res,func)
                }):m.router[method]('/'+k,func)
            }
        }
    }
}
