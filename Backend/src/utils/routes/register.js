const express = require('express');
const router = express.Router();
const userSchema = require('../schema/userSchema');
const ValidateSchema = require('../validate/registerValidate');
const verificationMessage = require('../verify/verificationMessage');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    const verifyCode = crypto.randomBytes(3).toString('hex');

    try {

        const user = await userSchema.findOne({ username });
        const findEmail = await userSchema.findOne({ email });

        // input validation
        const { error } = ValidateSchema.validate({ username, email, password, confirmPassword });
        if (error) {
            const errors = {};
            error.details.forEach(err => {
                const field = err.path[0]
                errors[field] = err.message
            })
            return res.status(400).json(errors);
        }

        //  username validation
        if (user && user.isVerified) return res.status(409).json({ username: 'username has been taken' });

        // email validation
        if (findEmail && findEmail.isVerified) return res.status(409).json({ email: 'email has been taken' });

        // hashed password
        const hashPassword = await bcrypt.hash(password, 5);

        // cooldown re register
        const now = new Date();
        const cooldown = 120 * 1000;

        if (user && now - user.resendTime < cooldown) return res.status(400).json({ message: "please wait until cooldown time register is done" });
        if (findEmail  && (now - findEmail.resendTime) < cooldown) return res.status(400).json({ message: "please wait until cooldown time register is done" });

        if ((user && !user.isVerified) || (findEmail && !findEmail.isVerified)) {
            await verificationMessage.sendMail({
                from: process.env.NODEMAILER_USER_EMAIL,
                to: email,
                subject: "*** REGISTRATION VERIFICATION CODE ***",
                text: `
                ********************************************
                ***   Your Verification Code ${verifyCode}  ***
                ****    Code expired in 10 minute    ****
                ********************************************
                `
            });

            await userSchema.updateOne(
                { _id: user?._id || findEmail._id },
                {
                    $set: {
                        username,
                        email,
                        password: hashPassword,
                        verificationCode: verifyCode,
                        verificationExpired: new Date(Date.now() + 10 * 60 * 1000),
                        resendTime : new Date()
                    }
                }
            )
            return res.status(200).json({ message: 'verification code has been resent' });
        };

        await verificationMessage.sendMail({
            from: process.env.NODEMAILER_USER_EMAIL,
            to: email,
            subject: "*** REGISTRATION VERIFICATION CODE ***",
            text: `
            ********************************************
            ***   Your Verification Code ${verifyCode}  ***
            ****    Code expired in 10 minute    ****
            ********************************************
            `
        });

        const newUser = new userSchema({
            username,
            email,
            password: hashPassword,
            isVerified: false,
            verificationCode: verifyCode,
            verificationExpired: new Date(Date.now() + 10 * 60 * 1000),
            resendTime : new Date()
        });

        await newUser.save();

        return res.status(201).json({ message: 'registration user successful' });
        
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }

});

router.post('/verification', async (req, res) => {
    const { username, code } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ message: "code is invalid" })

    try {
        const user = await userSchema.findOne({ username });

        if (!user) return res.status(400).json({ message: 'invalid username' });
        if (user.verificationCode !== code) return res.status(400).json({ message: 'code is invalid' });
        if (user && user.verificationExpired < new Date()) return res.status(400).json({ message: 'code has been expired' })
        
        if (user.verificationCode === code && user.verificationExpired > new Date()) {
            await userSchema.updateOne(
                { _id: user._id },
                {
                    $set: {
                        isVerified: true,
                        verificationCode: null,
                        verificationExpired: null,
                        resendTime: null
                    }
                }
            )
        };

        return res.status(200).json({ message: 'create account user successfully' });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' })
    }
});

router.post('/resentregistercode', async (req, res) => {
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
