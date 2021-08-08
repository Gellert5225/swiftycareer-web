const db    = require('../model/index');
const User  = db.user;
const Role  = db.role;

var jwt     = require('jsonwebtoken');
var bcrypt  = require('bcryptjs');

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const hash_pw = (password, salt) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, salt).then((result) => {
            resolve(result);
        }, error => {
            reject(error);
        });
    });
}

exports.signUp = ({ username, email, password, roles }) => {
    return new Promise((resolve, reject) => {
        hash_pw(password, 8).then((hashed_pw) => {
            const user = new User({
                username: username,
                email: email,
                hashed_password: hashed_pw
            });

            user.save((err, user) => {
                if (err) { reject({ status: 500, error: err }); return; }
                
                var token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                    expiresIn: 30
                });

                if (roles) {
                    Role.find({ name: { $in: roles } }, (err, roles) => {
                        if (err) { reject({ status: 500, error: err }); return; }
                        user.roles = roles.map(role => role._id);
                        user.save(err => {
                            if (err) { reject({ status: 500, error: err }); return; }
                            resolve({ 
                                status: 200, 
                                user: { 
                                    id: user._id, 
                                    username: user.username, 
                                    roles: user.roles, 
                                    accessToken: token 
                                } 
                            });
                        });
                    });
                } else {
                    Role.findOne({ name: 'user' }, (err, role) => {
                        if (err) { reject({ status: 500, error: err }); return; }
                        user.roles = [role._id];
                        user.save(err => {
                            if (err) { reject({ status: 500, error: err }); return }
                            resolve({ 
                                status: 200, 
                                user: { 
                                    id: user._id, 
                                    username: user.username, 
                                    roles: user.roles, 
                                    accessToken: token 
                                } 
                            });
                        });
                    });
                }
            });
        }, error => {
            reject({ status: 500, error: error });
        });
    });
}

exports.signIn = ({ username, password }) => {
    return new Promise((resolve, reject) => {
        User.findOne({ username: username }).populate('roles', '-__V').exec((err, user) => {
            if (err) { reject({ status: 500, error: err }); return; }
    
            if (!user) { reject({ status: 404, error: 'Username does not exist!' }); return; }

            bcrypt.compare(password, user.hashed_password, (err, res) => {
                if (err) { reject({ status: 500, error: err }); return; }
                if (!res) { reject({ status: 401, error: 'Invalid Password' }); return; }
                
                var token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                    expiresIn: 30
                });
    
                resolve({ 
                    status: 200, 
                    user: { 
                        id: user._id, 
                        username: user.username, 
                        roles: user.roles, 
                        accessToken: token 
                    } 
                });
            });
        });
    });
}