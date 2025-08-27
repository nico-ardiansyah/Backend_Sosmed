const express = require('express');
const router = express.Router();
const JWTVerify = require('../verify/JWTverify');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const fileSchema = require('../schema/filePostSchema');
const postSchema = require('../schema/postSchema');
const userSchema = require('../schema/userSchema');

// connect supabase client 
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY );

// Sett multi for upload file
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/uploadpost',JWTVerify, upload.array('file', 10), async (req, res) => {
    const { content } = req.body;
    const files = req.files;
    const isFileEmpty = !files || files.length === 0;
    const maxSize = 50 * 1024 * 1024;

    try {
        
        if (!content && isFileEmpty) return res.status(400).json({ message: 'content or file is required' });
        if (files && files.length >= 1) {
            for (const file of files) {
                if (file.size > maxSize) {
                    return res.status(400).json({ message: 'total file size too big' });
                };
            };
        };

        let newFiles = [];

        if (files) {
            for (const file of files) {
                const fileExt = file.originalname.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${req.user._id}/${fileName}`;

                const { data, error } = await supabase.storage
                    .from(process.env.SUPABASE_BUCKET_POST)
                    .upload(filePath, file.buffer, {
                        contentType: file.mimetype
                    });
                
                
                if (error) {
                    console.error('upload file failed', error.message);
                    return res.status(500).json({ message: 'upload file failed' });
                };
    
                const { data: publicUrlData } = supabase.storage
                    .from(process.env.SUPABASE_BUCKET_POST)
                    .getPublicUrl(filePath);
                
                const newFile = new fileSchema({
                    fileName,
                    fileType: fileExt,
                    size: file.size,
                    url: publicUrlData.publicUrl,
                    author: req.user._id,
                });
                
                await newFile.save();
                newFiles.push(newFile);
            }

            
        };

        const newUpload = new postSchema({
            content,
            author: req.user._id,
            editable: new Date(Date.now() + 10 * 60 * 1000),
            files: files ? newFiles.map(file => file._id) : [],
        });

        await userSchema.findByIdAndUpdate(req.user._id, {
            $push : {posts : newUpload._id}
        })

        await newUpload.save();

        return res.status(201).json({ message: 'create post successfully' });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "internal server error" });
    }
});

router.delete('/deletepost/:postId', JWTVerify, async (req, res) => {
    const { postId } = req.params;

    try {
        const findPost = await postSchema.findOne({ _id: postId, author: req.user._id }).populate('files');
        if (!findPost) return res.status(404).json({ message: "post not found or unauthorized" });

        if (findPost.files.length > 0) {
            for (const file of findPost.files) {
                const filePath = `${req.user._id}/${file.fileName}`;
                const { error: deleteError } = await supabase.storage
                    .from(process.env.SUPABASE_BUCKET_POST)
                    .remove([filePath])
                
                if (deleteError) {
                    console.error('failed to delete file', deleteError.message);
                    return res.status(500).json({ message: 'failed deleted file from storage' });
                }

                await fileSchema.findByIdAndDelete(file._id)
            }
        };

        await userSchema.findByIdAndUpdate(req.user._id, {
            $pull : {posts : postId}
        })
        await postSchema.findByIdAndDelete(postId)

        return res.status(200).json({ message: 'post deleted succesfully' });

    } catch (e) {  
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }
});


router.get('/allpost', JWTVerify, async (req, res) => {
    try {
        const post = await postSchema.find({})
            .sort({createdAt : -1})
            .populate('files')
            .populate('comments')
            .populate('author');

        return res.json({ post });

    } catch (e) {
        console.error(e)
        return res.status(500).json({ message: "internal server error" });
    }
});


router.patch('/updatepost/:postId', JWTVerify, upload.array('file'), async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;

    try {
        if (!content || !content.trim()) return res.status(400).json({ message: 'content is requred' });

        findPost = await postSchema.findOne({ _id:postId, author:req.user._id });
        const finalEdit = 10 * 60 * 1000;
        
        if (!findPost) return res.status(400).json({ message: 'post not found or unauthorized' });
        if ((Date.now() - findPost.createdAt) > finalEdit) return res.status(400).json({ message: 'out of time for edit post' });

        await postSchema.updateOne(
            { _id : findPost._id },
            {
                $set: {
                    content,
                }
            }
        );

        return res.status(200).json({ message : 'update post success'})

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }
});

router.get('/detailpost/:postId', JWTVerify, async (req, res) => {
    const { postId } = req.params;
    try {
        const data = await postSchema.findById(postId).populate('files').populate({
            path: 'comments',
            populate: [{ path: 'file' }, { path: 'author' }]
        }).populate('author')

        if (!data) return res.status(404).json({ message: 'post not found' });

        return res.status(200).json({ data })

    } catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'internal server error' })
    }
});

module.exports = router;