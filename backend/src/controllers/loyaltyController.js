const Loyalty = require('../models/loyaltyModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.calculateLoyaltyPoints = catchAsync(async (userId, amount) => {
  const points = Math.floor(amount * 10);
  await Loyalty.findOneAndUpdate(
    { user: userId },
    { $inc: { points } },
    { upsert: true, new: true }
  );
});

exports.redeemReward = catchAsync(async (req, res, next) => {
  const reward = await Reward.findById(req.params.rewardId);
  const loyalty = await Loyalty.findOne({ user: req.user.id });

  if (loyalty.points < reward.pointsRequired) {
    return next(new AppError('Pontos insuficientes para resgatar esta recompensa', 400));
  }

  loyalty.points -= reward.pointsRequired;
  loyalty.rewardsRedeemed.push({ rewardId: reward._id, redeemedAt: Date.now() });
  await loyalty.save();

  res.status(200).json({
    status: 'success',
    data: { loyalty }
  });
});

exports.updateLoyaltyPoints = async (userId, points) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  user.loyaltyPoints += points;
  
  // Atualiza o tier baseado nos pontos
  if (user.loyaltyPoints >= 1000) {
    user.loyaltyTier = 'ouro';
  } else if (user.loyaltyPoints >= 500) {
    user.loyaltyTier = 'prata';
  }
  
  await user.save();
  return user;
};

exports.getLoyaltyStatus = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('Usuário não encontrado', 404));
  }

  let nextTier = null;
  let pointsToNextTier = 0;

  if (user.loyaltyTier === 'bronze') {
    nextTier = 'prata';
    pointsToNextTier = 500 - user.loyaltyPoints;
  } else if (user.loyaltyTier === 'prata') {
    nextTier = 'ouro';
    pointsToNextTier = 1000 - user.loyaltyPoints;
  }

  res.status(200).json({
    status: 'success',
    data: {
      tier: user.loyaltyTier,
      points: user.loyaltyPoints,
      nextTier,
      pointsToNextTier: pointsToNextTier > 0 ? pointsToNextTier : 0
    }
  });
});

exports.addPointsForPurchase = async (req, res, next) => {
  try {
    const purchaseAmount = req.body.amount;
    const pointsToAdd = Math.floor(purchaseAmount * 10); // 10 pontos por real gasto
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { loyaltyPoints: pointsToAdd }
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        pointsAdded: pointsToAdd,
        totalPoints: user.loyaltyPoints,
        tier: user.loyaltyTier
      }
    });
  } catch (err) {
    next(err);
  }
};
