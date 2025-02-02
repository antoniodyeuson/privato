const sharp = require('sharp');

exports.addWatermark = async (buffer, userId) => {
  const text = `© Privato - ${userId}`;
  return await sharp(buffer)
    .composite([{ input: Buffer.from(text, 'utf8'), gravity: 'southeast' }])
    .toBuffer();
};
