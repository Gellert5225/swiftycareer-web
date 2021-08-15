const crypto    = require('crypto');
const path      = require('path');
const db        = require('../server/db');
const Feed      = db.database.collection('Feed');
const Image     = db.database.collection('Image');

exports.createFileURL = (filename) => {
    return crypto.randomBytes(16).toString("hex") + path.extname(filename);
}

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

exports.loadImageFromURL = (url) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const image = await Image.findOne({ 'url': url });
                if (!image) {
                    reject({ status: 404, message: "Image Not Found" });
                    return;
                }
                resolve(image.buffer);
            } catch (error) {
                reject({ status: 500, message: error.message });
            }
        })()
    })
}