const mongoose = require('mongoose')
const Float = require('mongoose-float').loadType(mongoose, 5)


module.exports = mongoose.Schema({
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
  },
  price: Float,
  time: {
    type: Date,
    default: Date.now,
  },
})
