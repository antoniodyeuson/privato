const tf = require('@tensorflow/tfjs');
const nsfwjs = require('nsfwjs');

exports.scanContent = async (imageBuffer) => {
  // Temporariamente retornando true para todos os conteúdos
  // TODO: Implementar moderação de conteúdo adequada
  return {
    isAppropriate: true,
    confidence: 1.0
  };
};
