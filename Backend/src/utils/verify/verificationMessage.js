const nodemailer = require('nodemailer');
require('dotenv').config();

const verificationMessage = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure : false,
    auth: {
        user: process.env.NODEMAILER_USER_EMAIL,
        pass: process.env.NODEMAILER_USER_PASS
    }
});


module.exports = verificationMessage;