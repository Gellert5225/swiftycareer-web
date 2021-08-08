const db   = require('../server/db');
const User = db.database.collection('User');
const Role = db.database.collection('Role');

var jwt    = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

exports.signUp = (user) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                user.hashed_password = await bcrypt.hash(user.password, 8);
                delete user.password;

                if (user.roles) {
                    let roles_query_results = await Role.find({"name" : {"$in" : user.roles}}).toArray();
                    user.roles = roles_query_results;
                } else {
                    let user_role = await Role.findOne({ name: 'user' });
                    user.roles = [user_role._id];
                }

                let insert_user_response = await User.insertOne(user);
                const result_user = insert_user_response.ops[0];
                var token = jwt.sign({ id: result_user._id }, process.env.JWT_SECRET, {
                    expiresIn: 30
                });
                resolve({ 
                    status: 200, 
                    user: { 
                        id: result_user._id, 
                        username: result_user.username, 
                        roles: result_user.roles, 
                        accessToken: token 
                    } 
                });
            } catch (error) {
                reject({ status: 500, error: error });
            }
        })();
    });
}

exports.signIn = ({ username, password }) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                let user = await User.findOne({ username: username });
                if (!user) { reject({ status: 404, error: 'Username does not exist!' }); return; }

                let bcrypt_res = await bcrypt.compare(password, user.hashed_password);
                if (!bcrypt_res) { reject({ status: 401, error: 'Invalid Password' }); return; }
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
            } catch (error) {
                reject({ status: 500, error: error });
            }
        })();
    });
}