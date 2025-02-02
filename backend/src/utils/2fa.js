const speakeasy = require('speakeasy');

exports.generateSecret = () => {
  return speakeasy.generateSecret({ length: 20 });
};

exports.verifyToken = (secret, token) => {
  return speakeasy.totp.verify({ secret, token, encoding: 'base32' });
};
