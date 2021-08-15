const { profile } = require('console');
const { Readable } = require('stream');
const db = require('../server/db');
const User = db.database.collection('User');
const Feed = db.database.collection('Feed');
const Image = db.database.collection('Image');
const Comment = db.database.collection('Comment');
const fileUtil = require('./file_util');
const crypto = require('crypto');
const path = require('path');

exports.getFeeds = () => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const feeds = await Feed.find().sort({ created_at: -1 }).toArray();
                var feedsResponse = [];
                for (var feed of feeds) {
                    try {
                        const user = await User.findOne({ _id: db.mongodb.ObjectID(feed.author_id) });
                        feed.author = {
                            username: user.username,
                            display_name: user.display_name,
                            bio: user.bio,
                            position: user.position,
                            roles: user.roles,
                            profile_picture: user.profile_picture
                        };
                        feedsResponse.push(feed);
                    } catch (error) {
                        console.log(error);
                        reject({ status: 500, message: error.message });
                    }
                }
                resolve(feedsResponse);
            } catch (error) {
                reject({ status: 500, message: error.message });
            }
        })();
    });
}

exports.postFeed = ({ files, body }) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                let urls = [];
                for (file of files) {
                    file.url = fileUtil.createFileURL(file.originalname);
                    urls.push(file.url);

                    const image = {
                        originalname: file.originalname,
                        fieldname: file.fieldname,
                        encoding: file.encoding,
                        mimetype: file.mimetype,
                        buffer: file.buffer,
                        size: file.size,
                        url: file.url
                    };

                    await Image.insertOne(image);
                }

                const feed = {
                    created_at: Date.now(),
                    like_count: 0,
                    comment_count: 0,
                    share_count: 0,
                    text_JSON: body.text_JSON,
                    text: body.text_HTML,
                    author_id: body.authorId,
                    images: urls,
                    liked_user_ids: []
                }

                let insert_feed_response = await Feed.insertOne(feed);
                const result_feed = insert_feed_response.ops[0];
                result_feed.images = urls;
                resolve(result_feed)
            } catch (error) {
                reject({ status: 500, message: error.message });
            }
        })();
    });
}

exports.putFeed = ({ feedId, userId, amount }) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const likeAmount = parseInt(amount);
                let update = {};
                if (likeAmount > 0) {
                    update = { $inc: { like_count: likeAmount }, $push: { liked_user_ids: userId } };
                } else {
                    update = { $inc: { like_count: likeAmount }, $pull: { liked_user_ids: userId } };
                }
                const feed = await Feed.findOneAndUpdate(
                    { _id: db.mongodb.ObjectID(feedId) }, 
                    update,
                    { update: true }
                );
                
                resolve(feed);
            } catch (error) {
                reject({ status: 500, message: error.message });
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