const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// Rotas do Twitter
router.get('/twitter/auth', 
  authController.protect,
  passport.authenticate('twitter')
);

router.get('/twitter/callback',
  passport.authenticate('twitter', { 
    failureRedirect: '/login',
    successRedirect: '/profile'
  })
);

// Rotas do Instagram
router.get('/instagram/auth',
  authController.protect,
  passport.authenticate('instagram')
);

router.get('/instagram/callback',
  passport.authenticate('instagram', {
    failureRedirect: '/login',
    successRedirect: '/profile'
  })
);

// Desconectar redes sociais
router.post('/disconnect/:platform',
  authController.protect,
  async (req, res, next) => {
    try {
      const { platform } = req.params;
      const update = {
        [`socialConnections.${platform}.connected`]: false,
        [`socialConnections.${platform}.username`]: null,
        [`socialConnections.${platform}.token`]: null
      };
      
      await User.findByIdAndUpdate(req.user.id, update);
      
      res.status(200).json({
        status: 'success',
        message: `Desconectado do ${platform} com sucesso`
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
