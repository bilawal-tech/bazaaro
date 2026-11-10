const jwt = require('jsonwebtoken');
const User = require('../models/User');

const secuirityGard = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized — no token'
            });
        }

        // remove bearer from token
        const token = authHeader.split(' ')[1];


        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized — user not found'
            });
        }

        //  User request mein attach karo
        req.user = user;


        next();

    } catch (error) {


        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized — invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized — token expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const forAdmin = (req, res, next) =>{
    if(req.user && req.user.role === 'admin'){
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied — admin only'
        });
    }           
}
module.exports = {
    protect: secuirityGard,
    adminOnly: forAdmin,
}