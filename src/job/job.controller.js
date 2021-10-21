const jobService = require('./job.service');

module.exports = function(app) {
    app.get('/job', function(req, res) {
        res.render('job');
    });

    app.get('/jobs', async function(req, res) {
        try {
            const jobs = await jobService.getJobsWithQuery(req.query);
            res.status(200).json({ code: 200, info: jobs, error: null });
        } catch (error) {
            if (!error.status) error.status = 500;
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
        }
    });

    app.post('/jobs', async function(req, res) {
        try {
            const job = await jobService.postJob(req.body);
            res.status(200).json({ code: 200, info: job, error: null });
        } catch (error ){
            if (!error.status) error.status = 500;
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
        }
    });
}
