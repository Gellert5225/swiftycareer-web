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
            res.cookie('user_jwt', response['user']['accessToken'], {maxAge: 10000000000, secure: process.env.NODE_ENV === 'prod', httpOnly: true});
            res.json(response);
        }, error => {
            res.status(error.status).json({ code: error.status, info: 'error', error: error });
        });
    });

    app.post('/api/rest/auth/signin', function(req, res) {
        authentication.signIn({
            username: req.body.username, 
            password: req.body.password
        }).then((response) => {
            res.cookie('user_jwt', response['user']['accessToken'], {maxAge: 10000000000, secure: process.env.NODE_ENV === 'prod', httpOnly: true});
            res.json(response);
        }, error => {
            res.status(error.status).json({ code: error.status, info: 'error', error: error });
        });
    });

    app.get('/testCookieJwt', verifyToken, function(req, res) {
        //console.log(req.cookies.user_jwt);
        res.status(200).send({ code: 200, info: `Authorized ${req.userId}` });
    });
}