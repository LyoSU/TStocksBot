const mongoose = require('mongoose')
const Float = require('mongoose-float').loadType(mongoose, 5)


module.exports = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
  },
  amount: Number,
  costBasis: Float,
  time: {
    type: Date,
    default: Date.now,
  },
})

