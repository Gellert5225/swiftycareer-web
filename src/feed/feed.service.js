const { Readable }          = require('stream');
const fileUtil              = require('../utils/file_util');
const db                    = require('../server/db');
const User                  = db.database.collection('User');
const Feed                  = db.database.collection('Feed');
const Image                 = db.database.collection('Image');
const Comment               = db.database.collection('Comment');
const Relation_CommentFeed  = db.database.collection('_Relation:comments:Feed');

exports.getFeeds = async () => {
    const feeds = await Feed.aggregate([
        {
            $lookup: {
                from : "User",
                localField: "author_id",
                foreignField: "_id",
                as : "author"
            }
        },
        {
            $unwind: "$author"
        },
        {
            $project: { "author.hashed_password": 0 }
        },
        {
            $sort: { "created_at": -1 }
        }
    ]).toArray();
    return feeds;
}

exports.postFeed = async ({ files, body }) => {
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
        author_id: db.mongodb.ObjectID(body.authorId),
        images: urls,
        liked_user_ids: [],
        comments: []
    }

    let insert_feed_response = await Feed.insertOne(feed);
    const result_feed = insert_feed_response.ops[0];
    result_feed.images = urls;
    return result_feed;
}

exports.putFeed = async ({ feed_id, user_id, amount }) => {
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

    return feed;
}

exports.getComments = async ({ feed_id }) => {
    const feed = await Feed.findOne({ _id: db.mongodb.ObjectID(feed_id) });
    const comments = await Comment.aggregate([
        {
            $match: { _id: { $in: feed.comments } }
        },
        {
            $lookup: {
                from: 'User',
                localField: 'author_id',
                foreignField: '_id',
                as: 'author'
            }
        },
        {
            $unwind: '$author'
        },
        {
            $project: { "author.hashed_password": 0 }
        },
        {
            $sort: { like_count: -1, created_at: -1 }
        }
    ]).toArray();

    return comments;
}

exports.postComment = async ({text, commenter, feed_id}) => {
    const comment = {
        created_at: Date.now(),
        text: htmlencode(text),
        feed_id: db.mongodb.ObjectID(feed_id),
        author_id: db.mongodb.ObjectID(commenter),
        like_count: 0
    }

    const insert_comment_response = await Comment.insertOne(comment);
    const result_comment = insert_comment_response.ops[0];

    const user = await User.findOne(db.mongodb.ObjectID(commenter), { projection: { hashed_password: 0 } });
    result_comment.author = user;
    const update = { $inc: { comment_count: 1 }, $push: { comments: result_comment._id } };
    await Feed.findOneAndUpdate({ _id: db.mongodb.ObjectID(feed_id) }, update, { update: true });

    // const relation = {
    //     owner: db.mongodb.ObjectID(feed_id),
    //     ownee: result_comment._id
    // }

    // await Relation_CommentFeed.insertOne(relation);

    return result_comment;
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

function htmlencode(str) {
    return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
