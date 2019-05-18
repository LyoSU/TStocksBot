const mongoose = require('mongoose')
const Float = require('mongoose-float').loadType(mongoose, 5)


const { Schema } = mongoose

module.exports = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  stock: {
    type: Schema.Types.ObjectId,
    ref: 'Stock',
  },
  amount: Number,
  costBasis: Float,
  date: {
    type: Date,
    default: Date.now,
  },
})

