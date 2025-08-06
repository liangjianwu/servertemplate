const {ErrorHint} = require('./console')

const ReturnMsg = {
    msg100000:'Processed successfully',
    msg100001:'Verification code has been sent successfully',
    msg100002:'Code verification succeeded',
    msg100003:'Password reset successful',
    msg100061:'Updated successfully',
}
const ErrorMsg = {
    err900000:'Bad request',
    err900001:'Exception, failed to operate data',
    err900002:'Session is invalid, please login again',        
    err900005:'Exception, failed to find ua data',
    err900003:'Session is timeout',
    err900004:'Need to login',
    err900005:'Failed to create the company', 
    err900006:'Failed to create the data object',     
    err900007:'Duplicate data exists',     
    err900008:'Requestion was refused',
    err900009:'Requestion is not in checklist',
    err900010:'There is no default role in system',
    err900012:'The data does not exists',
    
    //servicectrl
    err910001:'Exception, failed to load menu',
    err910002:'Exception, failed to load services',
    err910003:'You have not register company or business yet',
    err910004:'Failed to find the service',
    err910005:'Just super admin can apply a service',
    err910006:'The data does not exist',
    //upload
    err920001:'File should be excel file that the suffix is "xls" or "xlsx"',
    err920002:'Failed to save the file',
    err920003:'Exception, failed to load mu data',
    err920004:'Exception, failed to load mg data',
    err920005:'File should be image file that the suffix is "jpg" or "png" or "jpeg"',
    //register
    err100001:'The email has been used',
    err190001:'Exception, failed to create authorization data',
    err190002:'Exception, failed to create account', 
    //sendcode
    err191001:'Exception, failed to create uv data',
    err191002:'Exception, failed to update uv data',
    err191003:'Exception, failed to find user data',
    err100011:'The account does not exist',
    //verifycode
    err190021:'Exception, failed to update user data',
    err190022:'Exception, failed to find user data',
    err190023:'Exception, failed to find uv data',
    err190024:'Exception, failed to update uv data',
    err100021:'Code verification failed',
    err100022:'The code has expired',
    err100023:'The code is invalid',        
    //resetpwd
    err190031:'Exception, failed to update user data',
    err190032:'Exception, failed to find user data',
    err190033:'Exception, failed to find uv data',    
    err190034:'Exception, failed to update data',    
    err190035:'Your password has not been changed!',
    err100032:'The code has expired',
    err100033:'The code is invalid', 
    //login
    err190041:'Exception, failed to create uv data',
    err190042:'Exception, failed to update uv data',    
    err190043:'Exception, failed to find user data',    
    err100041:'Account does not exist or password is wrong',
    //logout
    err100051:'Exception, failed to logout',
    //profile
    err100061:'Your profile does not exist',
    err100062:'Your account does not exist',
    err190061:'Exception, failed to find user data',
    err190062:'Exception, failed to find user profile',
    err100063:'Failed to update profile',

    //add company
    err200001:"You can't be in two companies at the same time",
    err200002:'Exception, failed to add user to the company',
    err200003:'Exception, failed to create company',
    err200004:'Exception, failed to find mu data',
    err200005:'Exception, failed to find up data',
    err200006:'Exception, failed to create company,try to join the company',
    

    //loadCustomer
    err300001:'Failed to load user data',
    err300002:'Failed to update member inforation',
    //getmember
    err300003:'Failed to load member information',
    //addGroup
    err300004:'The group already exists',
    err300005:'Failed to get mu data',
    //addToGroup
    err300006:'Some member or group do not belong to you',
    //removeFromGroup
    err300007:'The group does not exist!',
    err300008:'The member points are not enough',    
    //member
    //recharge
    err400001:'Balance type is invalid',
    err400002:'No balance to charge',
    err400003:'No enough balance to charge',
    err400004:'Someone has not enough balance to charge',
    err400005:'Failed to charge',
    err400006:'You can not recharge the member',
    err400007:'You can not charge someone,perhaps they are not your members',
    

    //refund
    err400008:'The original record does not exist',
    err400009:'Refund too much',
    err400010:'The amount is invalid',
    err400011:'The member balance does not exist',
    err400012:"The member's balance is not enough to refund",
    err400013:"Failed to update member's balance",
    err400014:"You can't refund the member",
    err400015:"you can not edit it",
    err400017:"The order has been refund,you can not edit it",
    err400016:'The product is invalid',
    err400028:"The order has expired and cannot be refuned",
    //cancel
    err400018:'Failed to cancel transaction',
    err400019:'You can not cancel transaction',

    err400020:'The balance does not exist',
    err400021:'You do not need to pay so much!',
    err400022:'The balance type does not exist!',
    err400023:'The lessons or lesson price can not be 0',
    err400024:'The amount must be an integer multiple of the lesson price',
    err400025:'The refunded amount of lessons is too much',
    err400026:'The balance type can not be supported',
    err400027:'You can not refund to cash account',
    //emailctrl
    //edittemplate
    err500001:"Failed to find the template",
    err500002:"Failed to find the task",
    err500003:"Can't edit the task because the task has been executed",
    
    //eventctrl
    //getevent
    err600001:"Failed to find the event",
    err610001:"The event does not exist",
    err610002:"Failed to apply the event",
    err610003:"Expired to apply the event",
    err610004:"Too early to apply the event",
    err610005:'You have paid for the event',
    err610006:'Failed to verify token',
    
    //member client
    err700001:'Failed to update the data',
    err700002:'Failed to find merchant code',
    err700003:"This chapter has expired",
    err700004:"This member has not been assigned the chapter",
    err700005:"Can not change the chapter because the student has passed the chapter",
    err700006:"The student has not been assigned the chapter!",
    err800001:'The schedule does not exists',

    //pay
    //lesson
    err800001:'Course already exists',
    err800002:'Course does not exist',
    err800003:'Lesson does not exist',
    err800004:'Lesson page is not exists',
    //class
    err810001:'Class name already exists',
    err810002:'Class does not exists',
    err810003:'Class member does not exists',
    err810004:'Class schedule does not exists',
    err810005:'Unable to complete the course before the due date',
    err810006:'Class member already exists',
    err810007:'Class member is disabled',
    err810008:'The member has exit the class',
    err810009:'The record has been settled',
    err810010:'The member was invalid at this day',
    err810011:'The record aleady exists',    
    err810012:'The record does not exists',    
    err810013:'Can not change the attendance status because of the settle status',
    //lesson checkin
    err820001:'Schedule or lesson is invalid',
    err820002:'Now is not the time for class',
    err820003:'you cannot enter this class',
    err820004:'The teacher has not checked in yet, please wait',
    err820005:'Token check failed',
    err830001:'The lesson points can not be negtive number!',
    err830002:'The coach does not exists',
    err830003:"The record does not exists",

    //package
    err830001:'Package name already exists!',
    err830002:'Package does not exist!',
    err830003:'Course already exists in the package',
    err830004:'Course Categroy does not exist or is not authorized',
    err830005:'Course does not exist or is not authorized',
    err830005:'Course package does not exist!',
    err830006:'The member account of this course has banned, can recharge it!',
    err830007:'The member account of the course already exists',
    err830008:'The member account of the course does not exist!',
    err830009:'The member account of the course does not exist or has insufficient balance!',
}

const errorMsg = (code,msg)=>{
    if(!msg && !ErrorMsg['err'+code]) {
        ErrorHint("Error code: "+ code + " is indefined")
        return {success:false,data:ReturnMsg['err' + 900000]};
    }
    return {success:false,data:{errcode:code,error:msg?msg:ErrorMsg['err'+code]}};
}
const successMsg = (code,msg)=>{
    if(!ReturnMsg['msg'+code]) {
        ErrorHint("Message code: "+ code + " is indefined")
        return {success:true,data:ReturnMsg['msg' + 100000]};
    }
    return {success:true,data:msg?msg:ReturnMsg['msg'+code]};
}
module.exports.getErrorMessage = (code) => {
    return ErrorMsg['err' + code]
}
module.exports.getMessage = (code) => {
    return ReturnMsg['msg' + code]
}
module.exports.returnError = (res,code,msg) => {
    return res.status(400).json(errorMsg(code,msg))
}
module.exports.returnSuccess = (res,code,msg)=>{
    return res.status(200).json(successMsg(code,msg))
}
module.exports.returnResult = (res,data)=>{
    return res.status(200).json(successMsg(100000,data))
}