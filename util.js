const crypto = require('crypto');

const generateKey = function() {
  var sha = crypto.createHash('sha256');
  sha.update(Math.random().toString());
  return sha.digest('hex');
};


module.exports = {
  generateKey,
}