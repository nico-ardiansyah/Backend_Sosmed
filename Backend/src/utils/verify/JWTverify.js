const jwt = require('jsonwebtoken');
require('dotenv').config();

// function JWT
const JWTVerify = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "token missing" });

    jwt.verify(token, process.env.JWT_SECRETKEY, (err, user) => {
        if (err) return res.status(403).json({ message: "token invalid" });
        req.user = user;
        next();
    });
};


module.exports = JWTVerify;