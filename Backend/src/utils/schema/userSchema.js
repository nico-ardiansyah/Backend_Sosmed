const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'username is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        trim: true,
    }, 
    
    isVerified: {
        type: Boolean,
        required: [true, 'isVerified is required'],
        default: false,
    },
    verificationCode: {
        type : mongoose.Schema.Types.Mixed,
        required: [true, 'verificationCode is required'],
    },
    verificationExpired: {
        type: Number,
        required: [true, 'verificationEpired is required'],
    },
    resendTime: {
        type: Number,
        required: [true, 'resendTime is required'],
    },
    avatar: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'fileavatar',
            default: null
        },
        url : {
            type: String,
            default : 'https://vtmoldwasuxeblfkuoqs.supabase.co/storage/v1/object/public/avatars/defaultavatar/noprofileavatar.png'
        }
    },
    description: {
        type: String,
        default : null
    },
    name: {
        type: String,
        default : null
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Post'
    }]
});

const User = mongoose.model('User', userSchema, 'users');
module.exports = User;