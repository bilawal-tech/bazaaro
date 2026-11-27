const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Har protected request par user DB se nikalna CPU aur query dono kharch karta hai.
// 30 second ka chhota cache (role/delete ka asar zyada se zyada itni der baad). AUTH_CACHE_SECONDS=0 = cache band.
const CACHE_MS = (process.env.AUTH_CACHE_SECONDS === undefined ? 30 : Number(process.env.AUTH_CACHE_SECONDS)) * 1000;
const userCache = new Map();
const clearAuthCache = (id) => (id ? userCache.delete(String(id)) : userCache.clear());

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


        let user;
        const hit = CACHE_MS > 0 ? userCache.get(String(decoded.id)) : null;
        if (hit && hit.exp > Date.now()) {
            user = hit.user;
        } else {
            user = await User.findById(decoded.id).select('-password').lean();
            if (user && CACHE_MS > 0) {
                if (userCache.size > 5000) userCache.clear();
                userCache.set(String(decoded.id), { user, exp: Date.now() + CACHE_MS });
            }
        }

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
    clearAuthCache,
}