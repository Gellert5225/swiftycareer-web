const authRoute = require('./auth/auth.controller');
const feedRoute = require('./feed/feed.controller');
const jobRoute  = require('./job/job.controller');
const fileRoute = require('./file/file.controller');
const { verifyToken } = require('./middleware/authJWT');

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
    jobRoute(app);
}