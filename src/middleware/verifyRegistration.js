/**
 * Middleware
 * Checking user signIn and signUp criterias
 */

const db = require('../server/db');
const ROLES = db.ROLES;
const User = db.database.collection('User');

checkDuplicateUser = (req, res, next) => {
    User.findOne({
        username: req.body.username
    }).then(user => {
        if (user) {
            res.status(400).send({ code: 400, info: 'error', error: 'Username already exists!' });
            return;
        }

        User.findOne({
            email: req.body.email
        }).then(user => {
            if (user) {
                res.status(400).send({ code: 400, info: 'error', error: 'Email alreay exists!' });
                return;
            }

            next();
        }, err => {
            res.status(500).send({ code: 500, info: 'error', error: err });
            return;
        })
    }, err => {
        res.status(500).send({ code: 500, info: 'error', error: err });
        return;
    });
}

checkRoleExisted = (req, res, next) => {
    const roles = req.body.roles ? req.body.roles : [];

    roles.forEach(role => {
        if (!ROLES.includes(role)) {
            res.status(400).send({ code: 500, info: 'error', error: `Role ${role} does not exist` });
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