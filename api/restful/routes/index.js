const authRoute = require('./auth');
const feedRoute = require('./feed');

const multer    = require('multer');
const storage   = multer.memoryStorage();
const upload    = multer({ storage: storage });

module.exports = function(app) {
    authRoute(app);
    feedRoute(app, upload);
}