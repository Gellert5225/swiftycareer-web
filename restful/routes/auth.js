const { verifyRegistration }    = require('../../middleware');
const { verifyToken }           = require('../../middleware/authJWT');
const authentication            = require('../../view_model/auth');

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
            res.cookie('user_jwt', response['user']['accessToken'], {secure: false, httpOnly: true});
            res.send(response);
        }, error => {
            res.send(error);
        });
    });

    app.post('/api/rest/auth/signin', function(req, res) {
        authentication.signIn({
            username: req.body.username, 
            password: req.body.password
        }).then((response) => {
            res.cookie('user_jwt', response['user']['accessToken'], {secure: false, httpOnly: true});
            res.send(response);
        }, error => {
            res.send(error);
        });
    });

    app.get('/testCookieJwt', verifyToken, function(req, res) {
        console.log(req.cookies.user_jwt);
        res.status(200).json({ user: req.userId });
    });
}