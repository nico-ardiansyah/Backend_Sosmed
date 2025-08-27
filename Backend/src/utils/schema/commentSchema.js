const mongoose = require('mongoose');

const commentsSchema = new mongoose.Schema({
    content: {
        type: String,
        default : ''
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    }, 
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required : true
    },
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Filecomment',
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    }],
    replyComments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReplyComment',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        timestamps : true
    },
});


const commentSchema = mongoose.model('Comment', commentsSchema);

module.exports = commentSchema;