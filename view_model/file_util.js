const db = require('../server/db');
const Feed = db.database.collection('Feed');
const Image = db.database.collection('Image');

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
                    reject({ code: 404, info: 'error', error: "Image Not Found" });
                    return;
                }
                console.log(url);
                console.log(image);
                resolve(image.buffer);
            } catch (error) {
                reject({ error: error.message });
            }
        })()
    })
}