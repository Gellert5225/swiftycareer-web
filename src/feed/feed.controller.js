const { verifyToken }   = require('../middleware/authJWT');
const feedViewModel     = require('./feed.service');

module.exports = function(app, upload) {
    app.get('/feeds', async function(req, res) {
        try {
            const feeds = await feedViewModel.getFeeds();
            res.status(200).json({ code: 200, info: feeds, error: null });
        } catch (error) {
            if (!error.status) error.status = 500;
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message })
        }
    });

    app.get('/feed', verifyToken, function(req, res) {
        res.render('feed');
    });

    app.post('/feeds', async function(req, res) {
        upload.array('feedImage', 5)(req, res, async (err) => {
            if (err) { return res.status(400).json({ code: error.code, info: 'error', error: err }); }

            try {
                const result = await feedViewModel.postFeed({ files: req.files, body: req.body });
                res.status(201).json({ code: 200, info: result, error: null });
            } catch (error) {
                if (!error.status) error.status = 500;
                res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
            }
        });
    });

    app.put('/feeds/:id/likes', async function(req, res) {
        try {
            const result = await feedViewModel.putFeed({ feed_id: req.params.id, user_id: req.body.userId, amount: req.body.amount });
            if (!result.lastErrorObject.updatedExisting && result.lastErrorObject.n === 0)
                res.status(404).json({ code: 404, info: 'error', error: `Could not find object with id ${req.params.id}` });
            if (!result.lastErrorObject.updatedExisting)
                res.status(500).json({ code: 500, info: 'error', error: 'Internal server error' });

            res.status(200).json({ code: 200, info: result.value, error: null });
        } catch (error) {
            if (!error.status) error.status = 500;
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
        }
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
