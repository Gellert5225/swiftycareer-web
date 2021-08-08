const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type _User {
        _id: String!
        username: String!
        hashed_password: String!
        _created_at: Date!
        _updated_at: Date!
        email: String!
        display_name: String!
        position: String
        profilePicture: String!
    }
`)