const { verifyRegistration }    = require('../../middleware');
const { verifyToken }           = require('../../middleware/authJWT');
const authentication            = require('../../../view_model/auth');

require('dotenv').config({ path: `${__dirname }/.env.${process.env.NODE_ENV}` })

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
        next();
    });

    app.post('/api/rest/auth/signup', [verifyRegistration.checkDuplicateUser, verifyRegistration.checkRoleExisted], function(req, res) {
        authentication.signUp({ 
            username: req.body.username, 
            email: req.body.email, 
            password: req.body.password, 
            roles: req.body.roles
        }).then((response) => {
            res.session.cookie('user_jwt', response['accessToken'], {maxAge: 10000000000, secure: process.env.NODE_ENV === 'prod', httpOnly: true});
            delete response['accessToken'];
            res.status(200).json({ code: 200, info: response, error: null });
        }, error => {
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
        });
    });

    app.post('/api/rest/auth/signin', function(req, res) {
        authentication.signIn({
            username: req.body.username, 
            password: req.body.password,
        }).then((response) => {
            res.cookie('user_jwt', response['accessToken'], {maxAge: 10000000000, secure: process.env.NODE_ENV === 'prod', httpOnly: true});
            res.cookie('user_jwt_refresh', response['refreshToken'], {maxAge: 10000000000, path: '/api/auth/refreshJWT', secure: process.env.NODE_ENV === 'prod', httpOnly: true});
            res.cookie('user_session_id', response['session_id'], {maxAge: 10000000000, secure: process.env.NODE_ENV === 'prod', httpOnly: true});
            delete response['accessToken'];
            res.status(200).json({ code: 200, info: response, error: null });
        }, error => {
            req.flash('authError', error.message);
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
        });
    });

    app.post('/api/rest/auth/signout', function(req, res) {
        authentication.signOut(req.cookies.user_session_id).then((response) => {
            res.clearCookie('user_jwt');
            res.clearCookie('user_jwt_refresh', { path: '/api/auth/refreshJWT' });
            res.clearCookie('user_session_id');
            res.status(200).json({ code: 200, info: 'Signed Out', error: null });
        })
    });

    app.get('/api/auth/refreshJWT', function(req, res) {
        authentication.refreshJWT(req.cookies.user_session_id).then((response) => {
            res.cookie('user_jwt', response, {maxAge: 10000000000, secure: process.env.NODE_ENV === 'prod', httpOnly: true});
            const prevURL = req.session.prevURL;
            req.session.prevURL = null;
            res.redirect(prevURL);
        }, error => {
            res.clearCookie('user_jwt');
            res.clearCookie('user_jwt_refresh', { path: '/api/auth/refreshJWT' });
            res.clearCookie('user_session_id');
            if (req.accepts('html')) return res.redirect('/');
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
        });
    });

    app.get('/testCookieJwt', verifyToken, function(req, res) {
        //console.log(req.cookies.user_jwt);
        res.status(200).send({ code: 200, info: `Authorized ${req.userId}` });
    });
}