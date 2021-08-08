const jwt   = require('jsonwebtoken');
const db    = require('../model/index');
const User  = db.user;
const Role  = db.role;

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

verifyToken = (req, res, next) => {
    let token = req.cookies.user_jwt;
    if (!token) {
        return res.status(403).send({ message: 'No token provided!' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({message: 'Unauthorized'});
        }
        req.userId = decoded.id;
        next();
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