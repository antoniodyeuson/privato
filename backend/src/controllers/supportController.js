const Support = require('../models/supportModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.createTicket = catchAsync(async (req, res, next) => {
  const ticket = await Support.create({
    user: req.user.id,
    subject: req.body.subject,
    message: req.body.message
  });

  res.status(201).json({
    status: 'success',
    data: { ticket }
  });
});

exports.addResponse = catchAsync(async (req, res, next) => {
  const ticket = await Support.findById(req.params.id);
  
  if (!ticket) return next(new AppError('Ticket não encontrado', 404));
  
  ticket.responses.push({
    from: req.user.role === 'admin' ? 'support' : 'user',
    message: req.body.message
  });
  
  await ticket.save();
  
  res.status(200).json({
    status: 'success',
    data: { ticket }
  });
});
