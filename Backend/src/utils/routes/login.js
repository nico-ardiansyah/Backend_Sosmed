const express = require('express');
const router = express.Router();
const userSchema = require('../schema/userSchema');
const loginSchema = require('../validate/loginValidate');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();


router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // input validation
        const { error } = loginSchema.validate({ username, password });
        if (error) {
            const errors = {};
            error.details.forEach(err => {
                const field = err.path[0];
                errors[field] = err.message;
            })
            return res.status(400).json(errors);
        }

        // username validation
        const user = await userSchema.findOne({ username });
        if (!user) return res.status(401).json({ username: "username not found" });
        if (user && !user.isVerified) return res.status(403).json({ account: 'account is not verified' });

        // password validation
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ password: "wrong password" });

        const token = jwt.sign({ _id: user._id}, process.env.JWT_SECRETKEY, { expiresIn: '1h' });
        return res.status(200).json({ token });

    } catch (e) {
        console.error(e);
        return res.status(500).json({message : "internal server error"})
    }
});

module.exports = router;