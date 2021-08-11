const { profile } = require('console');
const { Readable } = require('stream');
const db = require('../server/db');
const User = db.database.collection('User');
const Feed = db.database.collection('Feed');
const Comment = db.database.collection('Comment');
const fileUtil = require('./file_util');

exports.getFeeds = () => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const feeds = await Feed.find().sort({ created_at: -1 }).toArray();
                console.log('begin');
                var feedsResponse = [];
                for (var feed of feeds) {
                    try {
                        const user = await User.findOne({ _id: db.mongodb.ObjectID(feed.author_id) });
                        const profile_pic = await fileUtil.imageDownloadPromises(user.profile_picture, 'profileImages');
                        console.log(user);
                        feed.author = {
                            username: user.username,
                            display_name: user.display_name,
                            bio: user.bio,
                            position: user.position,
                            roles: user.roles,
                            profile_pic: profile_pic
                        };
                        feedsResponse.push(feed);
                    } catch (error) {
                        console.log(error);
                    }
                }
                console.log('end');
                console.log(feedsResponse);
                resolve({status: 200, feeds: feedsResponse});
            } catch (error) {
                reject({ error: error });
            }
        })();
    });
}

exports.postFeed = ({ files, body }) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const feed = {
                    created_at: Date.now(),
                    like_count: 0,
                    comment_count: 0,
                    share_count: 0,
                    text_JSON: body.text_JSON,
                    text: body.text_HTML,
                    author_id: body.authorId,
                    images: files,
                    liked_user_ids: []
                }

                let insert_feed_response = await Feed.insertOne(feed);
                const result_feed = insert_feed_response.ops[0];
                result_feed.images.forEach(img => {
                    console.log(img.buffer);
                    img.buffer = new Buffer.from(img.buffer, 'binary').toString('base64')
                })
                resolve({
                    status: 200,
                    result_feed
                })
            } catch (error) {
                reject({ error: error });
            }
        })();
    });
}

exports.putFeed = ({ feedId, userId, amount }) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                console.log(feedId);
                console.log(parseInt(amount));
                const feed = await Feed.findOneAndUpdate(
                    { _id: db.mongodb.ObjectID(feedId) }, 
                    {
                        $inc: { like_count: parseInt(amount) },
                        $push: { liked_user_ids: userId } 
                    },
                    { update: true }
                );

                console.log(feed);
            } catch (error) {
                console.log(error);
            }
        })()
    });
}

exports.getComments = () => {

}

exports.postComment = (comment) => {

}

function imageUploadPromises(files) {
    var imageSavePromises = [];

    files.forEach(file => {
        let bucket = new db.mongodb.GridFSBucket(db.database, {
            bucketName: 'feedImages'
        });

        console.log(file);

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