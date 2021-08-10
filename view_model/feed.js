const { Readable } = require('stream');
const db   = require('../server/db');
const Feed = db.database.collection('Feed');
const Comment = db.database.collection('Comment');

exports.getFeeds = () => {

}

exports.postFeed = ({files, body}) => {
    console.log(body);
    return new Promise((resolve, reject) => {
        console.log('begin uploading');
        Promise.all(imageSavePromises(files)).then((values) => {
            (async () => {
                try {
                    const feed = {
                        like_count: 0,
                        comment_count: 0,
                        share_count: 0,
                        text_JSON: body.text_JSON,
                        text: body.text_HTML,
                        author_id: body.authorId,
                        images: values
                    }
    
                    let insert_feed_response = await Feed.insertOne(feed);
                    const result_feed = insert_feed_response.ops[0];
                    resolve({
                        status: 200,
                        result_feed
                    })
                } catch (error) {
                    reject({ error: error });
                }
            })();
        }, error => {
            reject({ error: error });
        });
    });
}

exports.getComments = () => {

}

exports.postComment = (comment) => {

}

function imageSavePromises(files) {
    var imageSavePromises = [];

    files.forEach(file => {
        console.log(file.originalname);
        let bucket = new db.mongodb.GridFSBucket(db.database, {
            bucketName: 'feedImages'
        });

        const readablePhotoStream = new Readable();
        readablePhotoStream.push(file.buffer);
        readablePhotoStream.push(null);
        
        imageSavePromises.push(new Promise((resolve, reject) => {
            let uploadStream = bucket.openUploadStream(file.originalname);
            let id = uploadStream.id;
            readablePhotoStream.pipe(uploadStream);

            uploadStream.on('error', (error) => {
                reject(error);
            });

            uploadStream.on('finish', () => {
                resolve(id);
            });
        }));
    });
    return imageSavePromises;
}