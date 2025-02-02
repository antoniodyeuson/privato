const axios = require('axios');

exports.shareToSocialMedia = async (platform, content) => {
  switch(platform) {
    case 'twitter':
      return axios.post('https://api.twitter.com/2/tweets', {
        text: content
      }, {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      });
    case 'instagram':
      // Lógica específica do Instagram
      break;
    default:
      throw new Error('Plataforma não suportada');
  }
};
