
const userModel = require("../Models/blogSchema");
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const OtpModel = require('../Models/blogOTP')
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken")


async function signup(req, res) {
    try {
        const { fname, lname, phoneNo, email, password, gender, FullAddress } = req.body;
        
        const schema = Joi.object({
            fname: Joi.string().alphanum().min(3).max(30).required(),
            lname: Joi.string().alphanum().min(3).max(50).required(),
            phoneNo: Joi.string().required(),
            email: Joi.string().required().email({ minDomainSegments: 2 }),
            password: Joi.string().required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
            gender: Joi.string().valid('Male', 'Female', 'Other').required(),
            FullAddress: Joi.string().required()
        });

        const { error } = schema.validate(req.body);

        if (error) {
            res.writeHead(400);
            res.end(error.details[0].message); 
            return; 
        }

        const checkUser = await user.findOne({email});

        if (checkUser) {
            res.writeHead(400)
            res.end("email is already registered with us")
        }
        else {
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const data = new user({ fname, lname, phoneNo, email, password: hashedPassword, gender, FullAddress });
                
                await data.save();
                
                const otp = Math.floor(100000 + Math.random() * 900000);
                await OtpModel.create({
                    userId: data._id,
                    otp,
                    isExpired: Date.now() + 90000
                });
        
                const transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com', 
                    port: 587, 
                    secure: false, 
                    auth: {
                        user: 'vaanchal05@gmail.com', 
                        pass: 'wxhe szef alcb tghv' 
                    }
                });
        
                const mailOptions = {
                    from: 'vaanchal05@gmail.com', 
                    to: email,
                    subject: 'Your Email Verification OTP',
                    html: `<strong>Your OTP for email verification is ${otp}</strong>`
                };
        
                const info = await transporter.sendMail(mailOptions);
                console.log('Email sent: %s', info.messageId);
        
                res.writeHead(200);
                res.end("Record is created and OTP email sent successfully");
            } catch (error) {
                console.error('Error sending OTP email:', error);
                res.writeHead(500);
                res.end("An error occurred while sending the OTP email");
            }
        }
    } catch (err) {
        console.error(err);
        res.writeHead(500);
        res.end("Internal Server Error");
    }
}
async function login(req,res){
    try {
        const {email,password} = req.body;
       
        const loginSchema = Joi.object({
            email: Joi.string()
            .required().email({ minDomainSegments: 2}),

            password: Joi.string()
            .required().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        })

        const {error} = await loginSchema.validate(req.body)
        
        if(error){
            res.end('Enter email-id and password')
        }

        const user = await userModel.findOne({email})
        console.log(user.email);

        if(!user){
            res.writeHead(400,{'Content-Type' : 'text/plain'})
            res.end('Email not provided')
        }

        const compare = await bcrypt.compare(password,user.password)
        if(!compare){
            res.writeHead(400,{'Content-Type' : 'text : plain'})
            res.end("Invalid Credentials")
        }

        if(!user.isVerify){
            res.writeHead(405,{'Content-Type':'text/plain'})
            res.end("Please verify your email first")
        }

        const token = jwt.sign({userId : user._id}, 'your-secret-key',{
            expiresIn : '1h'
        })

            const data = [{user},{token}]
            const jsonData = JSON.stringify(data)

            res.setHeader('Content-Type', 'application/json');
            res.end(jsonData)
    } catch (err) {
        console.log(err);
        return "Internal Server Error"
    }
}

async function verify_otp(req,res){

}
module.exports = { signup , login,verify_otp}