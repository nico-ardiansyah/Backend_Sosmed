const express = require('express');
const router = express.Router();
const userSchema = require('../schema/userSchema');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const JWTVerify = require('../verify/JWTverify');
const multer = require('multer');

// configuration supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// configuration multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/profile', JWTVerify, async (req, res) => {
    try {
        const userData = await userSchema.findById(req.user._id).populate({
            path: 'posts',
            options: {sort : {createdAt : -1}},
            populate: [{ path: 'files' }, {path : 'author'}]
        })
        
        return res.json({userData});

    } catch (e) {
        console.error(e)
        return res.status(500).json({ message : 'internal server error'})
    }
});

router.post('/avatar', JWTVerify, upload.single('file'), async (req, res) => {
    try {
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${req.user._id}/${fileName}`;

        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET_AVATARS)
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype
            });
        
        if (error) {
            console.log('upload avatar ', error.message);
            return res.status(500).json({ message: 'file upload failed' });
        };

        const { data: publicUrlData } = supabase.storage
            .from(process.env.SUPABASE_BUCKET_AVATARS)
            .getPublicUrl(filePath);
        
        await userSchema.findByIdAndUpdate(req.user._id, {
            $set: {
                avatar: publicUrlData.publicUrl
            }
        });

        return res.status(200).json({ message: 'uploaded avatar succesfull' });
        

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "internal server error" });
    }
});

router.post('/description', JWTVerify, async (req, res) => {
    const { content } = req.body;
    try {
        if (content && content.length >= 300) return res.status(400).json({ message: 'description only 300 length char' });

        await userSchema.findByIdAndUpdate(req.user._id, {
            $set: {
                description: content || undefined
            }
        });

        return res.status(200).json({ message: 'description updated' });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }
});

router.post('/name', JWTVerify, async (req, res) => {
    const { content } = req.body;

    try {
        await userSchema.findByIdAndUpdate(req.user._id, {
            $set: {
                name: content || undefined
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }
});

module.exports = router;