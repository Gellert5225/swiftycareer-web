const fileUtil = require('../../../view_model/file_util');
const path = require('path');

module.exports = (app) => {
    app.get('/api/files/:path', function(req, res) {
        fileUtil.loadImageFromURL(req.params.path).then(result => {
            try {
                const b64 = Buffer.from(result.buffer).toString('base64');
                const mimeType = path.extname(req.params.path);
                var img = Buffer.from(b64, 'base64');
                res.writeHead(200, {
                    'Content-Type': mimeType,
                    'Content-Length': img.length
                });
                res.status(200).end(img); 
            } catch (error) {
                res.status(500).json({ status: 500, message: error.message });
            }
        }, error => {
            res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
        })
    });
}