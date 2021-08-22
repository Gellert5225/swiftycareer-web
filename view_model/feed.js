const { Readable }          = require('stream');
const fileUtil              = require('./file_util');
const db                    = require('../server/db');
const User                  = db.database.collection('User');
const Feed                  = db.database.collection('Feed');
const Image                 = db.database.collection('Image');
const Comment               = db.database.collection('Comment');
const Relation_CommentFeed  = db.database.collection('_Relation:comments:Feed');

exports.getFeeds = () => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const feeds = await Feed.find().sort({ created_at: -1 }).toArray();
                var feeds_response = [];
                for (var feed of feeds) {
                    try {
                        const user = await User.findOne({ _id: db.mongodb.ObjectID(feed.author_id) });
                        feed.author = {
                            _id: user._id,
                            username: user.username,
                            display_name: user.display_name,
                            bio: user.bio,
                            position: user.position,
                            roles: user.roles,
                            profile_picture: user.profile_picture
                        };
                        feeds_response.push(feed);
                    } catch (error) {
                        console.log(error);
                        reject({ status: 500, message: error.message });
                    }
                }
                resolve(feeds_response);
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
                    liked_user_ids: [],
                    comments: []
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

exports.putFeed = ({ feed_id, user_id, amount }) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const likeAmount = parseInt(amount);
                let update = {};
                if (likeAmount > 0) {
                    update = { $inc: { like_count: likeAmount }, $push: { liked_user_ids: user_id } };
                } else {
                    update = { $inc: { like_count: likeAmount }, $pull: { liked_user_ids: user_id } };
                }
                const feed = await Feed.findOneAndUpdate(
                    { _id: db.mongodb.ObjectID(feed_id) }, 
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

exports.getComments = ({ feed_id }) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const feed = await Feed.findOne({ _id: db.mongodb.ObjectID(feed_id) });
                const comments = await Comment.find({ _id: { $in: feed.comments } }).sort({ like_count: -1, created_at: -1 }).toArray();

                for (let i = 0; i < comments.length; i++) {
                    try {
                        const user = await User.findOne({ _id: comments[i].author_id });
                        comments[i].author = {
                            _id: user._id,
                            username: user.username,
                            display_name: user.display_name,
                            bio: user.bio,
                            position: user.position,
                            roles: user.roles,
                            profile_picture: user.profile_picture
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }

                resolve(comments);
            } catch (error) {
                reject({ status: 500, message: error.message });
            }
        })()
    });
}

exports.postComment = ({text, commenter, feed_id}) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const comment = {
                    created_at: Date.now(),
                    text: htmlencode(text),
                    feed_id: db.mongodb.ObjectID(feed_id),
                    author_id: db.mongodb.ObjectID(commenter),
                    like_count: 0
                }
    
                const insert_comment_response = await Comment.insertOne(comment);
                const result_comment = insert_comment_response.ops[0];

                const user = await User.findOne(db.mongodb.ObjectID(commenter));
                result_comment.author = {
                    _id: user._id,
                    username: user.username,
                    display_name: user.display_name,
                    position: user.position,
                    profile_picture: user.profile_picture
                }
    
                const update = { $inc: { comment_count: 1 }, $push: { comments: result_comment._id } };
                await Feed.findOneAndUpdate({ _id: db.mongodb.ObjectID(feed_id) }, update, { update: true });

                // const relation = {
                //     owner: db.mongodb.ObjectID(feed_id),
                //     ownee: result_comment._id
                // }

                // await Relation_CommentFeed.insertOne(relation);
    
                resolve(result_comment);
            } catch (error) {
                reject({ status: 500, message: error.message });
            }
        })()
    });
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

function htmlencode(str) {
    return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}