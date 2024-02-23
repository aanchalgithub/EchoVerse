const mongoose = require('mongoose')
const roles = ["company","user"]

const blogSchema = mongoose.Schema({
    fname : {
        type : String,
        required : true
    },
    lname : {
        type : String,
        required : true
    },
    phoneNo : {
        type : Number,
        required : true
    },
    email : {
        type : String,
        require : true
    },
    password : {
        type : String,
        required : true
    },
    role : {
        type : String,
        default : "user",
        enum : roles
    },
    isVerify : {
        type : Boolean,
        default : false
    },
    gender : {
        type : String,
        enum : ["Male","Female","Other"]
    },
    FullAddress : {
        type : String
    }
},

{
    timestamps : true
})

const user = mongoose.model("user", blogSchema)
module.exports = user