const mongoose = require('mongoose')
const Float = require('mongoose-float').loadType(mongoose, 5)
const Stock = require('./stock')


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
    default: 100,
  },
}, {
  timestamps: true,
})

const User = mongoose.model('User', userSchema)

User.get = async (tgUser) => {
  let user = await User.findOne({ telegram_id: tgUser.id })

  if (!user) {
    user = new User()
    user.telegram_id = tgUser.id
  }
  user.first_name = tgUser.first_name
  user.last_name = tgUser.last_name
  user.username = tgUser.username
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

User.Portfolio.getByPeer = async (tgUser, peer) => {
  const user = await User.get(tgUser)
  const stock = await Stock.get(peer)
  const portfolio = await User.Portfolio.find({
    user,
    stock,
  })

  portfolio.stock = stock

  return portfolio
}

User.Portfolio.getByUser = async (tgUser) => {
  const user = await User.get(tgUser)
  const portfolio = await User.Portfolio.find({
    user,
  }).sort({ costBasis: -1 }).populate('stock')

  return portfolio
}

User.Portfolio.getByStock = async (peer) => {
  const stock = await Stock.get(peer)
  const portfolio = await User.Portfolio.find({
    stock,
  }).sort({ costBasis: -1 }).populate('stock')

  return portfolio
}

User.Portfolio.buy = async (tgUser, peer, amount) => {
  const user = await User.get(tgUser)
  const stock = await Stock.get(peer)

  if (user.balance >= stock.price) {
    user.balance -= stock.price
    user.save()

    const portfolio = new User.Portfolio()

    portfolio.user = user
    portfolio.stock = stock
    portfolio.amount = amount
    portfolio.costBasis = stock.price
    portfolio.save()

    return {
      portfolio,
    }
  }

  return {
    error: 'MONEY_ERROR',
  }
}

User.Portfolio.sell = async (tgUser, peer, amount) => {
  let sellAmount = 0
  const user = await User.get(tgUser)
  const portfolio = await User.Portfolio.getByPeer(tgUser, peer)

  if (portfolio.length > 0) {
    if (portfolio[0].amount <= amount) {
      portfolio[0].remove()
      sellAmount = portfolio[0].amount
    }
    else {
      portfolio[0].amount -= amount
      portfolio.save()
      sellAmount = amount
    }

    if (sellAmount > 0) {
      // eslint-disable-next-line max-len
      user.balance += (portfolio.stock.price * sellAmount) - (portfolio.stock.price * (global.gameConfig.sellFee / 100))
      user.save()
    }

    return {
      stock: portfolio.stock,
    }
  }

  return {
    error: 'NOT_FOUND',
  }
}

module.exports = User
