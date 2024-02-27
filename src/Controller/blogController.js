
const userModel = require("../Models/blogSchema");
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const OtpModel = require('../Models/blogOTP')
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken")
const generateRandomOtp = require("../Utils/generateRandomOtp")
const sendOTP = require('../Utils/sendOtp')


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

async function verify_otp(req, res) {
    try {
        const { email } = req.body;
       
        const emailSchema = Joi.object({
            email: Joi.string()
                .required().email({ minDomainSegments: 2 }),
            otp: Joi.string()
                .required().pattern(/\d{6}/)
        });
        const { error } = await emailSchema.validate(req.body);
        if (error) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end("Validation failed");
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end("Invalid Credentials");
        }

        const otp = await OtpModel.findOne({ userId: user._id });
        console.log(otp);
        if (!otp) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Otp not found or OTP has expired.' }));
        }
        if (otp.otp !== req.body.otp) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Invalid otp provided.' }));
        }

        const deletedOtp = await OtpModel.deleteOne({ _id: otp._id });
        console.log('OTP verified and deleted:', deletedOtp._id);

        await userModel.findOneAndUpdate({ email: user.email }, { $set: { isVerify: true } }, { new: true });

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("Otp Verified successfully");

    } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

async function resend_otp(req,res){
    const {email} = req.body
    console.log(req.body);

    const resendSchema = Joi.object({
        email: Joi.string().required()
    })

    const {error} = await resendSchema.validate(req.body)
    if(error){
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end("Validation failed");
    }

    const user = await userModel.findOne({email})
    if(!user){
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        return res.end("Validation failed");
    }

    const existingOtp = await OtpModel.findOne({
        userId: user._id,
        isVerified : false,
        isExpired: { $gte: Date.now() },
      });

      if(existingOtp){
        await sendOTP(user.email, existingOtp.otp)
        res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'Otp resent successfully' }));
        
      }

      await OtpModel.deleteMany({ userId: user._id });
   
      const newOtp = generateRandomOtp();

      
    const otp = new OtpModel({
        userId: user._id,
        otp: newOtp,
        // isExpired : false ,
        isVerified: false,
      });

      await otp.save();
      await sendOTP(email, newOtp);

      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Otp sent successfully' }));
}

async function forgotPassword(req,res){
    try {
        const { email } = req.body;
  
      
        const schema = Joi.object({
            email: Joi.string().required().email({ minDomainSegments: 2 }),
        });
  
        const { error } = await schema.validate(req.body);
        if (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Validation Error' }));
        }
  
       
        const user = await userModel.findOne({ email });
        if (!user) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'User not found' }));
        }
  
        
        const temporaryPassword = Math.random().toString(36).slice(-8);
  
       
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
  
        
        await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });
  
       
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
            subject: 'Your One-Time Password',
            html: `<p>Your temporary password is: <strong>${temporaryPassword}</strong>. Please use this to login and change your password.</p>`
        };
  
        await transporter.sendMail(mailOptions);
  
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Temporary send to your mail' }));
    } catch (error) {
        console.error("Error in forgot password:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Internal Server Error' }));
    }
  }

async function changePassword(req, res) {
        try {
          const { userId, newPassword } = req.body;
      
          if (!userId || !newPassword) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'User-Id and password is required' }));
          }
      
         
          const updatedUser = await userModel.findOneAndUpdate({ email: userId }, { password: newPassword }, { new: true });
      
          if (!updatedUser) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'User not found' }));
          }
      
          const hashedPassword = await bcrypt.hash(newPassword, 10);
      
          updatedUser.password = hashedPassword;
          await updatedUser.save();
      
          res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'Password Updated Successfully!..' }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
        }
}

module.exports = { signup , login,verify_otp,resend_otp,forgotPassword,changePassword}