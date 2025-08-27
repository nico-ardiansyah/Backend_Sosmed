const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required : true
    }, 
    fileType: {
        type: String,
        required : true
    },
    size: {
        type: Number,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

});


const uploadFileSchema = mongoose.model('Filepost', fileSchema);

module.exports = uploadFileSchema;