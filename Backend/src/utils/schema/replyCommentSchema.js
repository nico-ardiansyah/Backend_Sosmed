const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        required : true
    },
    content: {
        type: String,
        default : '',
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    }],
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'fileReplyComment'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        timestamps : true
    }
});

const replyCommentsSchema = mongoose.model('ReplyComment', schema);

module.exports = replyCommentsSchema;