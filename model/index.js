const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;
db.user = require('./user.js');
db.role = require('./role.js');
db.ROLES = ['user', 'admin', 'mod'];

module.exports = db;