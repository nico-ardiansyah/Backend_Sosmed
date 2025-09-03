const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    },
    url: {
        type: String,
        required : true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const fileReplyComment = mongoose.model('fileReplyComment', schema);

module.exports = fileReplyComment;