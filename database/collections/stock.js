const mongoose = require('mongoose')
const Float = require('mongoose-float').loadType(mongoose, 5)


const stockSchema = mongoose.Schema({
  channelId: {
    type: Number,
    index: true,
    unique: true,
    required: true,
  },
  symbol: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    index: true,
    unique: true,
    required: true,
  },
  title: String,
  price: Float,
  stats: {
    day: {
      chart: String,
      profitMoney: Float,
      profitProcent: Float,
    },
  },
}, {
  timestamps: true,
})

module.exports = stockSchema
