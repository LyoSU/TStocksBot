const mongoose = require('mongoose')
const Float = require('mongoose-float').loadType(mongoose, 5)


const stockSchema = mongoose.Schema({
  tgstatId: {
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
}, {
  timestamps: true,
})

const Stock = mongoose.model('Stock', stockSchema)

module.exports = Stock
