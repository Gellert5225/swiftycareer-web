const { verifyToken }   = require('../middleware/authJWT');
const feedViewModel     = require('./feed.service');

module.exports = function(app, upload) {
    app.get('/feeds', verifyToken, function(req, res) {
        feedViewModel.getFeeds().then(result => {
            res.status(200).json({ code: 200, info: result, error: null });
        }, error => {
            console.log('feed error ' + error.message);
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
        });
    });

    app.get('/feed', verifyToken, function(req, res) {
        res.render('feed');
    });

    app.post('/feeds', function(req, res) {
        upload.array('feedImage', 5)(req, res, (err) => {
            if (err) { return res.status(400).json({ code: error.code, info: 'error', error: err }); }
            feedViewModel.postFeed({ files: req.files, body: req.body }).then(result => {
                res.status(201).json({ code: 201, info: result, error: null });
            }, error => {
                res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
            });
        });
    });

    app.put('/feeds/:id/likes', function(req, res) {
        feedViewModel.putFeed({ feed_id: req.params.id, user_id: req.body.userId, amount: req.body.amount }).then(result => {
            res.status(200).json({ code: 200, info: result, error: null });
        }, error => {
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
        });
    });

    app.post('/feeds/:id/comments', function(req, res) {
        feedViewModel.postComment({ text: req.body.text, commenter: req.body.commenter, feed_id: req.params.id }).then(result => {
            res.status(200).json({ code: 200, info: result, error: null });
        });
    });

    app.get('/feeds/:id/comments', function(req, res) {
        feedViewModel.getComments({ feed_id: req.params.id }).then(result => {
            res.status(200).json({ code: 200, info: result, error: null });
        })
    });
}
