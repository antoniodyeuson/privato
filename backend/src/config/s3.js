const AWS = require('aws-sdk');
const config = require('./storage');

module.exports = new AWS.S3({
  accessKeyId: config.AWS_ACCESS_KEY,
  secretAccessKey: config.AWS_SECRET_KEY,
  region: 'sa-east-1'
});
