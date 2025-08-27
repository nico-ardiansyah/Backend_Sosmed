const express = require('express');
const router = express.Router();
const JWTVerify = require('../verify/JWTverify');

router.get('/loggedin', JWTVerify, (req, res) => {
    return res.status(200).json({ message : 'User Login', user: req.user})
});


module.exports = router;