/**
 * Middleware
 * Verify JWT token for authorization purposes
 */

const jwt   = require('jsonwebtoken');
const db    = require('../../server/db');
const User  = db.user;
const Role  = db.role;

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

verifyToken = (req, res, next) => {
    let token = req.cookies.user_jwt;
    
    if (!token) {
        req.flash('authError', 'Please login to access the content you requested.');
        if (req.accepts('html')) {
            if (req.originalUrl === '/') { res.render('landing'); } 
            else { res.redirect('/') }
            return;
        }
        return res.status(403).json({ code: 401, info: 'No Token Provided', error: 'Please login to access the content you requested.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            req.flash('authError', 'Invalid JWT token. Please login again.');
            if (req.accepts('html')) {
                if (req.originalUrl === '/') { res.render('landing'); }
                else { res.redirect('/') }
                return;
            }
            return res.status(401).json({ code: 403, info: 'Unauthorized', error: "Invalid JWT token. Please login again." });
        }
        req.userId = decoded.id;
        next();
    });
}

function decodeToken(token) {
    if (!token) {
        return null;
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return null;
        return decoded;
    });
}

isAdmin = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
    
        Role.find({ _id: { $in: user.roles } }, (err, roles) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }
            
            roles.forEach(role => {
                if (role.name === 'admin') {
                    next();
                    return;
                }
            });
    
            res.status(403).send({ message: "Require Admin Role!" });
            return;
            }
        );
    });
}
  
isModerator = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
    
        Role.find({ _id: { $in: user.roles } }, (err, roles) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }
    
            roles.forEach(role => {
                if (role.name === 'moderator') {
                    next();
                    return;
                }
            });
    
            res.status(403).send({ message: "Require Moderator Role!" });
            return;
            }
        );
    });
};
  
const authJwt = {
    verifyToken,
    isAdmin,
    isModerator
};

module.exports = authJwt;