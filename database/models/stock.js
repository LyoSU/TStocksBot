const {
  getMembers,
  tgstat,
} = require.main.require('./utils')
const mongoose = require('mongoose')
const Float = require('mongoose-float').loadType(mongoose, 5)


const historySchema = mongoose.Schema({
  price: Float,
  time: {
    type: Date,
    default: Date.now,
  },
})

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
  history: [historySchema],
}, {
  timestamps: true,
})

const Stock = mongoose.model('Stock', stockSchema)

Stock.get = async (username) => {
  let stock = await Stock.findOne({ username: { $regex: new RegExp(username, 'i') } })

  if (!stock) {
    const channel = await tgstat(username)
    const symbol = channel.username.replace(/[_aeiou0-9]/ig, '').substr(0, 5).toUpperCase()

    stock = new Stock()
    stock.tgstatId = channel.id
    stock.symbol = symbol
    stock.username = channel.username
    stock.title = channel.title
    await stock.save()
  }

  return stock
}

Stock.update = async (username) => {
  const channel = await tgstat(username)
  const members = await getMembers(channel.username)
  let price = ((members / 10000) * (channel.daily_reach / channel.avg_post_reach)) / 100

  price = parseFloat(price.toFixed(5))

  const stock = await Stock.get(username)

  stock.title = channel.title
  if (stock.price !== price) {
    stock.price = price
    stock.history.push({ price, time: new Date() })
  }
  stock.save()

  return { status: 'ok', stock }
}

module.exports = Stock
