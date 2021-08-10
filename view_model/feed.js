const { Readable } = require('stream');
const db = require('../server/db');
const User = db.database.collection('User');
const Feed = db.database.collection('Feed');
const Comment = db.database.collection('Comment');

exports.getFeeds = () => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const feeds = await Feed.find().toArray();
                console.log('begin');
                var feedsResponse = [];
                for (var feed of feeds) {
                    const user = await User.findOne({ _id: db.mongodb.ObjectID(feed.author_id) });
                    console.log(user);
                    feed.author = {
                        username: user.username,
                        roles: user.roles
                    };
                    var imageDatas = [];
                    for (const file of feed.images) {
                        const chunks = await imageDownloadPromises(file);
                        imageDatas.push(chunks);
                    }
                    feed.images = imageDatas;
                    feedsResponse.push(feed);
                }
                console.log('end');
                console.log(feedsResponse);
            } catch (error) {
                
            }
        })();
    });
}

exports.postFeed = ({files, body}) => {
    return new Promise((resolve, reject) => {
        Promise.all(imageUploadPromises(files)).then((values) => {
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

function retrieveAuthorPromise(id) {

}

function imageDownloadPromises(fileId) {
    let bucket = new db.mongodb.GridFSBucket(db.database, {
        bucketName: 'feedImages'
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
            resolve(data);
        });
    });
}

function imageUploadPromises(files) {
    var imageSavePromises = [];

    files.forEach(file => {
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