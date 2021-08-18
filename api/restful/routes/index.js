const authRoute = require('./auth');
const feedRoute = require('./feed');
const fileRoute = require('./file');
const { verifyToken } = require('../../middleware/authJWT');

const multer    = require('multer');
const storage   = multer.memoryStorage();
const upload    = multer({ storage: storage });

module.exports = function(app) {
    app.get('/', verifyToken, (req, res) => {
        res.status(200).redirect('feed');
    });

    authRoute(app);
    fileRoute(app);
    feedRoute(app, upload);
}