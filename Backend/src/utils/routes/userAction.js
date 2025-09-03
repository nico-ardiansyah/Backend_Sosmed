const express = require('express');
const router = express.Router();
const JWTVerify = require('../verify/JWTverify');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// schema
const fileCommentSchema = require('../schema/fileCommentSchema');
const commentSchema = require('../schema/commentSchema');
const postSchema = require('../schema/postSchema');
const fileReplyComment = require('../schema/fileReplyCommentSchema');
const replyCommentSchema = require('../schema/replyCommentSchema');
const userSchema = require('../schema/userSchema');
const fileAvatar = require('../schema/fileAvatar');

// connect supabase client 
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY );

// Sett multi for upload file
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/post/:postId/comment', JWTVerify, upload.single('file'), async (req, res) => {
    const { content } = req.body;
    const file = req.file;
    const { postId } = req.params;

    try {
        if (!content && !content.trim() && !file) return res.status(400).json({ message: 'content is require' });
        
        const post = await postSchema.findOne({ _id: postId });
        if (!post) return res.status(404).json({ message: 'post not found' });


        let newFile = null;

        if (file) {
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${req.user._id}/${fileName}`;

            const { data, error } = await supabase.storage
                .from(process.env.SUPABASE_BUCKET_COMMENT)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype
                });
            
            if (error) {
                console.error('upload failed', error.message);
                return res.status(500).json({ message: 'file upload failed' });
            };

            const { data: publicUrlData } = supabase.storage
                .from(process.env.SUPABASE_BUCKET_COMMENT)
                .getPublicUrl(filePath);
            
            newFile = new fileCommentSchema({
                            fileName,
                            fileType: fileExt,
                            size: file.size,
                            url: publicUrlData.publicUrl,
                            author: req.user._id,
                        });
            
            await newFile.save();
                            
        };

        const uploadComment = new commentSchema({
            content : content ? content : '',
            author: req.user._id,
            post: postId,
            file : file ? newFile._id : null
        });

        await postSchema.findByIdAndUpdate(postId, {
            $push: { comments: uploadComment._id },
        });

        await uploadComment.save();

        return res.status(200).json({ message : 'upload comment successfully'})


    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }
});

router.post('/post/:postId/like', JWTVerify, async (req, res) => {
    const { postId } = req.params;
    try {
        const findLike = await postSchema.findOne({ likes: req.user._id, _id:postId });

        let isLiked = false

        if (findLike) {
            await postSchema.findByIdAndUpdate(postId, {
                $pull: { likes: req.user._id },
            });
            isLiked = false
            return res.status(200).json({ message: 'dislike the post' });
        };

        await postSchema.findByIdAndUpdate(postId, {
            $push: { likes: req.user._id },
        });
        isLiked = true
        return res.status(200).json({ message: 'like the post'});

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }
});

router.post('/post/:postId/:commentId/replycomment', JWTVerify, upload.single('file'), async (req, res) => {
    const { postId, commentId } = req.params;
    const file = req.file;
    const { content } = req.body;
    try {
        if (!file && !content) return res.status(404).json({ message: 'content or file is required' });

        const post = await postSchema.findOne({_id : postId});
        if (!post) return res.status(404).json({ message: 'post not found' });

        const comment = await commentSchema.findOne({ post: postId, _id: commentId });
        if (!comment) return res.status(404).json({ message: 'comment not found' });
        

        let newFile = null;

        if (file) {
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${req.user._id}/${fileName}`;

            const { data, error } = await supabase.storage
                .from(process.env.SUPABASE_BUCKET_REPLYCOMMENT)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype
                });
            
            if (error) {
                console.error('upload failed', error.message);
                return res.status(500).json({ message: 'file upload failed' });
            };

            const { data: publicUrlData } = supabase.storage
                .from(process.env.SUPABASE_BUCKET_REPLYCOMMENT)
                .getPublicUrl(filePath);
            
            newFile = new fileReplyComment({
                fileName,
                fileType: fileExt,
                size: file.size,
                url: publicUrlData.publicUrl,
                author: req.user._id,
            });
            
            await newFile.save();
        };

        const uploadReply = new replyCommentSchema({
            comment: commentId,
            content: content ? content : '',
            author: req.user._id,
            file: file ? newFile._id : null,
        });

        await commentSchema.findByIdAndUpdate(commentId, {
            $push: { replyComments: uploadReply._id },
        });

        await uploadReply.save();

        return res.status(200).json({ message: 'reply comment posted successfully' });

    } catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'internal server error' });
    };
});

router.post('/post/:postId/:commentId/:replycommentId/like', JWTVerify, async (req, res) => {
    const { postId, commentId, replycommentId } = req.params;
    try {
        const post = await postSchema.findOne({ _id: postId });
        if (!post) return res.status(404).json({ message: 'post not found' });

        const comment = await commentSchema.findOne({ _id: commentId, post: postId });
        if (!comment) return res.status(404).json({ message: 'comment not found' });

        const replyComment = await replyCommentSchema.findOne({ _id: replycommentId, comment: commentId });
        if (!replyComment) return res.status(404).json({ message: 'reply comment not found' });

        const isLiked = replyComment.likes.includes(req.user._id)

        if (isLiked) {
            await replyCommentSchema.findByIdAndUpdate(replycommentId, {
                $pull: { likes: req.user._id },
            })
            return res.status(200).json({ message: 'disliked reply comment' });
        } else {
            await replyCommentSchema.findByIdAndUpdate(replycommentId, {
                $push: { likes: req.user._id },
            });
    
            return res.status(200).json({ message: 'liked reply comment successfully' });
        }

        
    } catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'internal server error' });
    }
});

router.post('/post/:postId/:commentId/like', JWTVerify, async (req, res) => {
    const { postId, commentId } = req.params;
    try {
        const post = await postSchema.findOne({ _id: postId });
        const comment = await commentSchema.findOne({ _id: commentId, post:postId });
        const findLike = await commentSchema.findOne({ _id: commentId, post: postId, likes: req.user._id });

        if (!post) return res.status(404).json({ message: 'post not found' });
        if (!comment) return res.status(404).json({ message: 'comment not found' });

        if (findLike) {
            await commentSchema.findByIdAndUpdate(commentId, {
                $pull: { likes: req.user._id },
            })
            return res.status(200).json({ message: 'disliked comment' });
        };

        await commentSchema.findByIdAndUpdate(commentId, {
            $push: { likes: req.user._id },
        });

        return res.status(200).json({ message: 'liked comment successfully' });
        
    } catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'internal server error' });
    }
});

router.post('/editprofile/:userId', upload.single('file'), JWTVerify, async (req, res) => {
    const { userId } = req.params;
    const file = req.file;
    const { name, description } = req.body;

    try {
        const user = await userSchema.findOne({ _id: userId });
        
        if (!user) return res.status(404).json({ message: 'user not found' });
        const findAvatar = user.avatar;

        let newFile = null;

        if (file) {
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${req.user._id}/${fileName}`;
    
            const { data, error } = await supabase.storage
                .from(process.env.SUPABASE_BUCKET_AVATARS)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype
                });
            
            if (error) {
                console.log('upload avatar ', error.message);
                return res.status(500).json({ message: 'file upload failed' });
            };
    
            const { data: publicUrlData } = supabase.storage
                .from(process.env.SUPABASE_BUCKET_AVATARS)
                .getPublicUrl(filePath);
            
            newFile = new fileAvatar({
                author: req.user._id,
                url: publicUrlData.publicUrl,
                fileName,
                fileType: fileExt,
                size : file.size
            });

            await newFile.save();
        };

        const defaultAvatar = 'https://vtmoldwasuxeblfkuoqs.supabase.co/storage/v1/object/public/avatars/defaultavatar/noprofileavatar.png';

        await userSchema.findByIdAndUpdate(userId, {
            $set: { avatar: file ? {_id : newFile._id, url: newFile.url } : { _id: findAvatar._id, url: findAvatar.url}, name : name === 'undefined' || name === 'null' ? null : name, description : description === 'undefined' || description === 'null' ? null : description },
        });

        return res.status(200).json({ message: 'edit profile success' });

    } catch (e) {
        console.error(e)
        return res.status(500).json({ message: 'internal server error' });
    }

});

router.get('/detailcomment/:postId/:commentId', JWTVerify, async (req, res) => {
    const { commentId, postId } = req.params;

    try {
        const findComment = await postSchema.findOne({ _id: postId, comments: commentId });

        if (!findComment) return res.status(404).json({ message: 'comment not found' });

        const data = await commentSchema.findOne({ _id: commentId }).populate('author').populate({
            path: 'replyComments',
            populate: [{ path: 'author' }, {path : 'file'}]
        }).populate('file')

        return res.status(200).json({data})

    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: 'internal server error' });
    }
});

module.exports = router;