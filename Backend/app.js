const express = require('express');
const app = express();
app.use(express.json());
require('dotenv').config();
const cron = require("node-cron");
const mongoose = require('mongoose');
const userSchema = require('./src/utils/schema/userSchema');
const cors = require('cors');
app.use(cors('http://localhost:5173'))

// router
const authentication = require('./src/utils/routes/register');
const login = require('./src/utils/routes/login');
const loggedin = require('./src/utils/routes/loggedin');
const resetPassword = require('./src/utils/routes/resetPassword');
const post = require('./src/utils/routes/post');
const userAction = require('./src/utils/routes/userAction');
const profile = require('./src/utils/routes/profile');

// connect to DB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('success connected to db'))
    .catch((e) => console.log(e))

// function node-cron
cron.schedule("*/5 * * * *", async () => {
    try {
        const now = new Date();
    
        const deleted = await userSchema.deleteMany({
            isVerified: false,
            verificationExpired: { $lt: now }
        });
    
        const updated = await userSchema.updateMany(
            {
                isVerified: true,
                verificationExpired: { $lt : now}
            }, 
            {
                $set: {
                    verificationCode: null,
                    verificationExpired: null,
                    resendTime: null
                }
            }
        )

        console.log(`Deleted: ${deleted.deletedCount}, Upadated: ${updated.modifiedCount}`)
    } catch (e) {
        console.error("cron job error :",e)
    }
});

// authentication
app.use('/user', authentication);
app.use('/user', login);
app.use('/user', loggedin);
app.use('/user', resetPassword);
app.use('/user', post);
app.use('/user', userAction);
app.use('/user', profile);

app.listen(process.env.PORT, () => {
    console.log('Server running at PORT', process.env.PORT)
});