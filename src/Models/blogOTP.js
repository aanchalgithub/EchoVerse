const mongoose = require("mongoose")

const blogOTPSchema = mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : true
    },
    otp : {
        type : String,
        required : true
    },
    isExpired : {
        type : Date,
        default : Date.now() + 3600000
    }
},
{
    timestamps : true
})

const Otp = new mongoose.model("otp",blogOTPSchema)
module.exports = Otp