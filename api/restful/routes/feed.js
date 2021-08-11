const { verifyToken }           = require('../../middleware/authJWT');
const feedViewModel             = require('../../../view_model/feed');

module.exports = function(app, upload) {
    app.get('/feeds', function(req, res) {
        feedViewModel.getFeeds().then(result => {
            res.json(result);
        })
    });

    app.get('/feed', function(req, res) {
        res.render('feed');
    });

    app.post('/feeds', function(req, res) {
        upload.array('feedImage', 5)(req, res, (err) => {
            if (err) { return res.status(400).json({ message: err }); }
            feedViewModel.postFeed({files: req.files, body: req.body}).then(result => {
                res.json(result);
            }, error => {
                res.json(error);
            });
        });
    });

    app.put('/feeds/:id/likes', function(req, res) {
        feedViewModel.putFeed({ feedId: req.params.id, userId: req.body.userId, amount: req.body.amount }).then(result => {
            
        });
    });
}