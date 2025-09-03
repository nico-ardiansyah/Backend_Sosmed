const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    },
    files: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Filepost',
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Comment'
    }],
    createdAt: {
        type: Date,
        default : Date.now
    },
    editable: {
        type : Date
    }

});


const Post = mongoose.model('Post', postSchema);

module.exports = Post;
