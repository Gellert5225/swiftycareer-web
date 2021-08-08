const { MongoClient }   = require("mongodb");

MongoClient.Promise = global.Promise;

const db = {};

db.connect = () => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(
            process.env.MONGODB_URI, 
            {useNewUrlParser: true, useUnifiedTopology: true}
        )
        .then((client) => {
            db.database = client.db('dev');
            resolve(client.db('dev'));
        })
        .catch(error => {
            reject(error);
        });
    });
}

db.mongoClient= MongoClient;
db.ROLES = ['user', 'admin', 'mod'];

module.exports = db;