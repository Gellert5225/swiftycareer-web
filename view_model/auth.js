/**
 * Handles the authentication - User SignUp and SignIn
 */

const fileUtil  = require('./file_util');
const db        = require('../server/db');
const User      = db.database.collection('User');
const Role      = db.database.collection('Role');
const Session   = db.database.collection('Session');

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
                    user.roles = [user_role];
                }

                user.created_at = Date.now();
                user.display_name = user.username;
                user.bio = '';
                user.position = '';
                user.profile_picture = '9153598f6891968d494b1e7f30c35142.png';

                const insert_user_response = await User.insertOne(user);
                const result_user = insert_user_response.ops[0];
                const token = jwt.sign({ id: result_user._id }, process.env.JWT_SECRET, { expiresIn: 60 });
                const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: parseInt(process.env.JWT_REFRESH_EXP) });
                const session = { refreshToken: refreshToken, user: user._id, expires_at: new Date().toString() };
                const session_response = await Session.insertOne(session);
                const session_result = session_response.ops[0];

                resolve({ 
                    _id: result_user._id, 
                    username: result_user.username, 
                    display_name: result_user.display_name,
                    bio: result_user.bio,
                    position: result_user.position,
                    roles: result_user.roles, 
                    accessToken: token,
                    refreshToken: refreshToken,
                    session_id: session_result._id,
                    profile_picture: "9153598f6891968d494b1e7f30c35142.png"
                } );
            } catch (error) {
                console.log(error.message);
                reject({ status: 500, message: error.message });
            }
        })();
    });
}

exports.signIn = ({ username, password }) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                let user = await User.findOne({ username: username });
                if (!user) { reject({ status: 404, message: 'Username does not exist!' }); return; }

                let bcrypt_res = await bcrypt.compare(password, user.hashed_password);
                if (!bcrypt_res) { reject({ status: 401, message: 'Invalid Password' }); return; }
                const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: 60 });
                const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: parseInt(process.env.JWT_REFRESH_EXP) });
                const session = { 
                    refreshToken: refreshToken,
                    user: user._id, 
                    created_at: new Date(Date.now()).toUTCString(),
                    expires_at: new Date(Date.now() + process.env.JWT_REFRESH_EXP * 1000).toUTCString()
                };
                const session_response = await Session.insertOne(session);
                const session_result = session_response.ops[0];

                resolve({ 
                    _id: user._id, 
                    username: user.username, 
                    display_name: user.display_name,
                    bio: user.bio,
                    position: user.position,
                    roles: user.roles, 
                    accessToken: token,
                    refreshToken: refreshToken,
                    session_id: session_result._id,
                    profile_picture: user.profile_picture
                });
            } catch (error) {
                reject({ status: 500, message: error.message });
            }
        })();
    });
}

exports.signOut = (session_id) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const session = await Session.deleteOne({ _id: db.mongodb.ObjectID(session_id) });
                if (session.deletedCount === 1) {
                    resolve();
                } else {
                    reject({ status: 500, message: `Could not find session id: ${session_id}` });
                }
                resolve();
            } catch (error) {
                reject({ status: 500, message: error.message });
            }
        })()
    })
}

exports.refreshJWT = (session_id) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const session = await Session.findOne({ _id: db.mongodb.ObjectID(session_id) });
                // verify refresh token
                const decoded = jwt.verify(session.refreshToken, process.env.JWT_SECRET);
                const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: 60 });
                resolve(accessToken);
            } catch (error) {
                try {
                    await this.signOut(session_id);
                } catch (error) {
                    reject({ status: 500, message: error.message });
                }
                reject({ status: 403, message: error.message === 'jwt expired' ? 'Session expired. Please sign in again.' : error.message });
            }
        })()
    });
}