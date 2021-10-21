const http = require('http');
const https = require('https');

require('dotenv').config({ path: `${__dirname }/.env.${process.env.NODE_ENV}` })

const request = process.env.NODE_ENV === 'prod' ? https : http;

module.exports = request;