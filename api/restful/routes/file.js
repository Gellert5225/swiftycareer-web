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
                res.end(img); 
            } catch (error) {
                res.send({ error: error });
            }
        }, error => {
            res.json(error);
        })
    });
}