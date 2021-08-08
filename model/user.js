const mongoose = require('mongoose');

const User = mongoose.model(
    "User",
    new mongoose.Schema({
        username: String,
        email: String,
        hashed_password: String,
        _created_at: Date,
        _updated_at: Date,
        display_name: String,
        position: String,
        profilePicture: String,
        roles: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        }]
    }),
    'User'
);

module.exports = User;