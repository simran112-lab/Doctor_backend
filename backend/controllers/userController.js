const bcrypt =require('bcryptjs');
const jwt =require('jsonwebtoken');
const jwtSeceretKey="qwertyuiopasdfghjklzxcvbnmqwert";
const userModel=require('../models/users')
const nodemailer = require("nodemailer");
const randomstring= require("randomstring")
const otpModel=require('../models/otp')


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kaurjeetsimran11@gmail.com',
        pass: 'saqc jcnh pjlm riko',
    },
});
register = async(req,res)=>{
    try{
        const { name,email,role ,password,otp} = req.body;
        let otpuser = await otpModel.findOne({ email });
        if (otpuser){
            if (otpuser.otpExpires < new Date()) {
                // send response that otp expires
                return res.status(200).json({status:202 });
            }
            if (otpuser.otp !== otp){
                //send response for invalid otp
                return res.status(200).json({status:203})
            }
            else{
            let user = await userModel.findOne({ email }); 
            if(!user){
                await otpModel.findOneAndDelete({ email });
                const salt = await bcrypt.genSalt(10);
                const secPassword = await bcrypt.hash(password, salt);
                const data = new userModel(
                              {
                                  name: name,
                                  email: email,
                                  password: secPassword,
                                  role: role
                              }
                          );
                          savedData=await data.save();
                  // send response for successfull regestration
                  res.status(200).json(savedData);
              }
              else {
                  //send response already registered
                  res.status(200).send({status:204});
              }
            }
        }
        else{
            //invalid request
            res.status(200).send({status:206});
        }
    }
    catch(error){
        console.log(error)
        res.status(500).send('Server Error');
    }
}
            login = async (req, res, next)=>{
            let email = req.body.email;
            let pwd = req.body.password;
            try {
            const data = await userModel.findOne ({ email });
            if (!data) {
            return res.status (400) .json({ message: "please enter correct credentials" });
            }
            const password = await bcrypt.compare (pwd, data.password);
            if (!password) {
            return res.status (400) .json ({ message: "please enter correct password" });
            }
            const key = { user: { id: data.id , role:data.role } };
            const options = {
            expiresIn: '1d',
         };
            const authToken = jwt.sign(key, jwtSeceretKey, options);
            return res.json ({ userData: data, authToken: authToken }) ;
            } catch (error) {
            res.status (500).json ({ message: error.message });
            }}
            

sendOtp = async(req,res)=>{
    const { email } = req.body;
    const charset = '0123456789';
    const otp =randomstring.generate({
               length: 6,
               charset: charset,
        });
    try{
        const userdata = await userModel.findOne({ email });
        if(userdata){
        const otpExpires = new Date();
        otpExpires.setMinutes(otpExpires.getMinutes() + 5);
        userdata.otp=otp
        userdata.otpExpires=otpExpires
        await userdata.save()
        }
        else{
           const newOtp = await otpModel.findOne({email})
           const otpExpires = new Date();
           otpExpires.setMinutes(otpExpires.getMinutes() + 5);
           if(newOtp){
               await otpModel.updateOne({ email: email }, { $set: { otp: otp, otpExpires: otpExpires } });
           }else{
            await new otpModel({
                email:email,
                otp:otp,
                otpExpires:otpExpires
             }).save()
           }
           
          
        }
        const mailOptions = {
            from: 'kaurjeetsimran11@gmail.com',
            to: email,
            subject: 'OTP for Registration',
            text: `Your OTP for registration is ${otp}`,
        };
       await transporter.sendMail(mailOptions);
       res.status(200).send({status:200});
    }
    catch(error){
        console.log(error)
        res.status(500).send({status:500});
    }
}
//resend otp 
resendOtp = async(req,res)=>{
    
    const { email } = req.body;
    const charset = '0123456789';
    const otp =randomstring.generate({
               length: 6,
               charset: charset,
        });
    try{
        const userdata = await userModel.findOne({ email });
        if(userdata){
        const otpExpires = new Date();
        otpExpires.setMinutes(otpExpires.getMinutes() + 5);
        userdata.otp=otp
        userdata.otpExpires=otpExpires
        await userdata.save()
        }
        else{
           const newOtp = await otpModel.findOne({email})
           const otpExpires = new Date();
           otpExpires.setMinutes(otpExpires.getMinutes() + 5);
           if(newOtp){
               await otpModel.updateOne({ email: email }, { $set: { otp: otp, otpExpires: otpExpires } });
           }else{
             //invalid request
             res.status(200).send({status:206});
            
           }
           
        }
        const mailOptions = {
            from: 'kaurjeetsimran11@gmail.com',
            to: email,
            subject: 'OTP for Registration',
            text: `Your OTP for registration is ${otp}`,
        };
       await transporter.sendMail(mailOptions);
       res.status(200).send({status:200});
    }
    catch(error){
        console.log(error)
        res.status(500).send({status:500});
    }
}
verifyOtp = async(req,res)=>{
    const { email, otp } = req.body;
    try {
        let user = await userModel.findOne({ email });
        if (!user) {
            //send otp if user does not exist
            return res.status(200).json({status:207});
        }
        if (user.otpExpires < new Date()) {
               // send response that otp expires
               return res.status(200).json({status:202 });
        }
        if (user.otp !== otp) {
            //send response for invalid otp
            return res.status(200).json({status:203})
        }
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        const key = { user: { id: user.id ,role:user.role} };
        const options = {
            expiresIn: '1d',
          };
        
        const authToken = jwt.sign(key, jwtSecretKey,options);
        return res.json({ userData: user, authToken: authToken });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}


userDetails = async (req,res) =>{
    try {
        const id = req.data.user.id;
        const userDetail = await userModel.findById( id );
        console.log(userDetail)
        res.status(200).json({ status: 200, userData: userDetail });
    } catch (error) {
          // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
          res.status(500).send({status:500});
    }
}





updateDetails = async(req,res)=>{
   try{
    const id = req.data.user.id
    const newProfileImage = req.file ? { profile_image: req.file.filename } : {};
        const existingData = await userModel.findById({ _id: id });
        if (existingData.fee_per_consultation !== req.body.fee_per_consultation
            || existingData.work_experience !== req.body.work_experience
            || existingData.qualification !== req.body.qualification
            || existingData.specialization !== req.body.specialization) {
            req.body.approval = 1;
        }
        const userData = await userModel.findByIdAndUpdate(id, { ...req.body, ...newProfileImage }, { new: true });
        res.status(200).json({ data: userData });
    
   }
   catch(error){
     // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
     res.status(500).send({status:500});
   }
}




changePassword = async (req,res)=>{
    try{
          const {email,password,otp} = req.body;
          const userdata = await userModel.findOne({ email });
          if(!userdata){
               return res.status(200).json({"status":207});
          }
          if (userdata.otpExpires < new Date()) {
               // send response that otp expires
                return res.status(200).json({status:202 });
          }
          if (userdata.otp !== otp) {
              //send response for invalid otp
                return res.status(200).json({status:203})
          }
          userdata.otp = undefined;
          userdata.otpExpires = undefined;
          const salt = await bcrypt.genSalt(10);
          const secPassword = await bcrypt.hash(password, salt);
          userdata.password=secPassword
          await userdata.save();
          res.status(200).json({status:200})
        }
    catch(error){
          // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
          res.status(500).send({status:500});
    }
}


sendOtppassword = async(req,res)=>{
    const { email } = req.body;
    const charset = '0123456789';
    const otp =randomstring.generate({
               length: 6,
               charset: charset,
        });
    try{
        const userdata = await userModel.findOne({ email });
        if(!userdata){
            res.status(200).json({"status":207});
        }
        const otpExpires = new Date();
        otpExpires.setMinutes(otpExpires.getMinutes() + 5);
        userdata.otp=otp
        userdata.otpExpires=otpExpires
        await userdata.save()
        const mailOptions = {
            from: 'otp788935@gmail.com',
            to: email,
            subject: 'OTP for Registration',
            text: `Your OTP for registration is ${otp}`,
        };
       await transporter.sendMail(mailOptions);
       res.status(200).send({status:200});
    }
    catch(error){
        // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
        res.status(500).send({status:500});
    }
}




module.exports={
    register,
    login,
    sendOtp,
    resendOtp,
    verifyOtp,
    userDetails,
    updateDetails,
    changePassword,
    sendOtppassword
}