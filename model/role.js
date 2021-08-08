const mongoose = require('mongoose');

const Role = mongoose.model(
    "Role",
    new mongoose.Schema({
        name: String
    }),
    "Role"
);

module.exports = Role;