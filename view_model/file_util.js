const db = require('../server/db');

exports.imageDownloadPromises = (fileId, bucketName) => {
    let bucket = new db.mongodb.GridFSBucket(db.database, {
        bucketName: bucketName
    });

    return new Promise ((resolve, reject) => {
        let downloadStream = bucket.openDownloadStream(fileId);
        var data;
        downloadStream.on('data', (chunk) => {
            data = chunk;
        });
        downloadStream.on('error', (error) => {
            reject(error);
        });
        downloadStream.on('end', () => {
            // var base64data = new Buffer.from(data, 'binary').toString('base64');
            // console.log(base64data);
            resolve(data);
        });
    });
}