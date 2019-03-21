const mongoose = require('mongoose')
const Float = require('mongoose-float').loadType(mongoose, 5)


const userSchema = mongoose.Schema({
  telegram_id: {
    type: Number,
    index: true,
    unique: true,
    required: true,
  },
  first_name: String,
  last_name: String,
  username: String,
  balance: {
    type: Float,
    default: 1.00000000,
  },
}, {
  timestamps: true,
})

const User = mongoose.model('User', userSchema)

User.get = async (ctx) => {
  let user = await User.findOne({ telegram_id: ctx.from.id })

  if (!user) {
    user = new User()
    user.telegram_id = ctx.from.id
  }
  user.first_name = ctx.from.first_name
  user.last_name = ctx.from.last_name
  user.username = ctx.from.username
  user.updatedAt = new Date()
  await user.save()

  return user
}

const portfolioSchema = mongoose.Schema({
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

User.Portfolio = mongoose.model('Portfolio', portfolioSchema)

User.Portfolio.buy = async (ctx, peer, amount) => {
  const user = await ctx.db.User.get(ctx)
  const stock = await ctx.db.Stock.get(peer)

  const portfolio = new User.Portfolio()

  portfolio.user = user.id
  portfolio.stock = stock.id
  portfolio.amount = amount
  portfolio.costBasis = stock.price
  await portfolio.save()

  return portfolio
}

module.exports = User
