const nodemailer = require('nodemailer');
require('dotenv').config();

const verificationMessage = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_USER_EMAIL,
        pass: process.env.NODEMAILER_USER_PASS
    }
});


module.exports = verificationMessage;