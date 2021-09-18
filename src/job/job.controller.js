module.exports = function(app) {
    app.get('/job', function(req, res) {
        res.render('job');
    })
}