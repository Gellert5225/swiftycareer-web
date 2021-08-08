const db = require('../model/index');
const ROLES = db.ROLES;
const User = db.user;

checkDuplicateUser = (req, res, next) => {
    User.findOne({
        username: req.body.username
    }).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (user) {
            res.status(400).send({ message: 'Username already exists!' });
            return;
        }

        User.findOne({
            email: req.body.email
        }).exec((err, user) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }
    
            if (user) {
                res.status(400).send({ message: 'Email already exists!' });
                return;
            }

            next();
        })
    })
}

checkRoleExisted = (req, res, next) => {
    const roles = req.body.roles ? req.body.roles : [];

    roles.forEach(role => {
        if (!ROLES.includes(role)) {
            res.status(400).send({ message: `Role ${role} does not exist` });
            return;
        }
    });
    next();
}

const verifyRegistration = {
    checkDuplicateUser,
    checkRoleExisted
};

module.exports = verifyRegistration;