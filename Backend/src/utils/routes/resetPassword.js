const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const userSchema = require('../schema/userSchema');
const crypto = require('crypto');
const verificationMessage = require('../verify/verificationMessage');
const newPasswordSchema = require('../validate/newPasswordValidate');
require('dotenv').config();


// verification message

router.post('/resetpassword', async (req, res) => {
    const { email } = req.body;

    // validation email
    const emailCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) return res.status(400).json({ message: 'email is required' });
    if (!emailCheck.test(email)) return res.status(400).json({ message: 'format email is invalid' });
    
    const verifyCode = crypto.randomBytes(3).toString('hex');
    
    try {

        const findEmail = await userSchema.findOne({ email });
        if (!findEmail) return res.status(400).json({ message: 'email not found' });
        if (findEmail && !findEmail.isVerified) return res.status(403).json({ message: 'register or verify your account first' });

        // cooldown request
        const now = new Date();
        const cooldown = 120 * 1000;
        if (findEmail.resendTime && (now - findEmail.resendTime) < cooldown) return res.status(400).json({ message: 'please wait until cooldown next request done' });

        // send verification code to email
        await verificationMessage.sendMail({
            from: process.env.NODMAILER_USER_EMAIL,
            to: email,
            subject: '*** RESET PASSWORD ***',
            text: `
                ********************************************
                ***   Your Verification Code ${verifyCode}  ***
                ****    Code expired in 10 minute    ****
                ********************************************
            `
        });

        // update database
        await userSchema.updateOne(
            { _id: findEmail._id },
            {
                $set: {
                    verificationCode: verifyCode,
                    verificationExpired: new Date(Date.now() + 10 * 60 * 1000),
                    resendTime: new Date()
                }
            }
        );

        return res.status(200).json({ message: 'verification code to reset password already send to email' });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "internal server error"})
    }
});


router.post('/setnewpassword', async (req, res) => {
    const { email, code, password, confirmPassword } = req.body;
    
    // code validation
    if (!code.trim()) return res.status(400).json({ message: 'code is required' });

    const { error } = newPasswordSchema.validate({ password, confirmPassword });
    if (error) {
        const errors = {};
        error.details.forEach(err => {
            const field = err.path[0]
            errors[field] = err.message
        })

        return res.status(409).json({errors})
    }
    
    try {
        const findEmail = await userSchema.findOne({ email });

        // validation
        if (!findEmail) return res.status(400).json({ message: 'email not found' });
        if (findEmail.verificationCode !== code) return res.status(400).json({ message: 'verification code is invalid' });
        if (findEmail.verificationExpired < new Date()) return res.status(400).json({ message: 'verification code has been expired' });

        // input validation

        // password validation
        const isPasswordValid = await bcrypt.compare(password, findEmail.password)
        if (isPasswordValid) return res.status(400).json({ password: "new password cannot use previous password" });

        // hash password
        const hashPassword = await bcrypt.hash(password, 5);
        
        // update date user
        await userSchema.updateOne(
            { _id: findEmail._id },
            {
                $set: {
                    password: hashPassword,
                    verificationCode: null,
                    verificationExpired: null,
                }
            }
        )

        return res.status(200).json({ message: "change password success " });


    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }
});

router.post('/resentresetpasswordcode', async (req, res) => {
    try {
        const { email } = req.body;
        const verifyCode = crypto.randomBytes(3).toString('hex');

        const now = new Date();
        const cooldown = 120 * 1000;

        // find email
        const emailCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email.trim()) return res.status(400).json({ message: 'email is required' });
        if (!emailCheck.test(email)) return res.status(400).json({ message: 'format email is invalid' });

        const findEmail = await userSchema.findOne({ email });
        if (!findEmail) return res.status(400).json({ message: 'email not found' });

        if (findEmail.resendTime && (now - findEmail.resendTime) < cooldown) return res.status(400).json({ message: 'please wait until cooldown time for resent code done' });

        await userSchema.updateOne(
            { _id: findEmail._id },
                
            {
                $set: {
                    verificationCode: verifyCode,
                    verificationExpired: new Date(Date.now() + 10 * 60 * 1000),
                    resendTime: new Date()
                }
            }
        );
        
        return res.status(200).json({ message : 'verification code has been resent'})

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }
});


module.exports = router;