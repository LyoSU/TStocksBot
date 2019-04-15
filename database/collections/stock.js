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
  available: {
    type: Boolean,
    default: true,
  },
  updatable: {
    type: Boolean,
    default: true,
  },
  price: Float,
  stats: {
    day: {
      chart: {
        type: String,
        default: '',
      },
      profitMoney: {
        type: Float,
        default: 0,
      },
      profitProcent: {
        type: Float,
        default: 0,
      },
    },
  },
}, {
  timestamps: true,
})

module.exports = stockSchema
