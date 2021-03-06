const {
  channelParse,
  uploadFile,
  chartGenerate,
} = require.main.require('./utils')
const dateFormat = require('dateformat')
const collections = require('./models')
const connection = require('./connection')


const db = {}

Object.keys(collections).forEach((collectionName) => {
  db[collectionName] = connection.model(collectionName, collections[collectionName])
})


db.User.get = async (tgUser) => {
  let telegramId = tgUser.id

  if (tgUser.telegram_id) telegramId = tgUser.telegram_id

  let user = await db.User.findOne({ telegram_id: telegramId })

  if (!user) {
    user = new db.User()
    user.telegram_id = tgUser.id
  }
  user.first_name = tgUser.first_name
  user.last_name = tgUser.last_name
  user.username = tgUser.username
  user.updatedAt = new Date()
  await user.save()

  return user
}

db.Portfolio.getByStockUser = async (tgUser, peer) => {
  const user = await db.User.get(tgUser)
  const stock = await db.Stock.get(peer)
  const portfolio = await db.Portfolio.find({
    user,
    stock,
  })

  portfolio.stock = stock

  return portfolio
}

db.Portfolio.getByUser = async (tgUser) => {
  const user = await db.User.get(tgUser)
  const portfolio = await db.Portfolio.find({
    user,
  }).sort({ costBasis: -1 }).populate('stock')

  return portfolio
}

db.Portfolio.getByStockAll = async (peer) => {
  const stock = await db.Stock.get(peer)
  const portfolio = await db.Portfolio.find({
    stock,
  }).sort({ costBasis: -1 }).populate('stock')

  return portfolio
}

db.Portfolio.getValue = async (tgUser) => {
  const portfolio = await db.Portfolio.getByUser(tgUser)
  let amountTotal = 0
  let costBasis = 0
  let cost = 0
  let profitMoney = 0
  let profitProcent = 0

  if (portfolio.length > 0) {
    portfolio.forEach((share) => {
      if (share.stock) {
        amountTotal += share.amount
        costBasis += share.costBasis * share.amount
        cost += share.stock.price * share.amount
        profitMoney += (share.stock.price * share.amount) - (share.costBasis * share.amount)
      }
    })
    profitProcent = (profitMoney / costBasis) * 100
  }

  return {
    shares: amountTotal,
    costBasis: parseFloat(costBasis.toFixed(5)),
    cost: parseFloat(cost.toFixed(5)),
    profitMoney: parseFloat(profitMoney.toFixed(5)),
    profitProcent: parseFloat(profitProcent.toFixed(2)),
  }
}

db.Portfolio.buy = async (tgUser, peer, basicAmount) => {
  const user = await db.User.get(tgUser)
  const stock = await db.Stock.get(peer)

  if (stock.available === false) {
    return {
      error: 'UNAVAILABLE',
    }
  }

  let amount = basicAmount

  if (user.balance <= stock.price * amount) {
    amount = Math.floor(user.balance / stock.price)
  }

  if (amount > 0 && stock.price > 0) {
    user.balance -= stock.price * amount
    user.save()

    const portfolio = new db.Portfolio()

    portfolio.user = user
    portfolio.stock = stock
    portfolio.amount = amount
    portfolio.costBasis = stock.price
    portfolio.save()

    return {
      portfolio,
      amount,
      costBasis: stock.price,
    }
  }

  return {
    error: 'MONEY_ERROR',
  }
}

db.Portfolio.sell = async (tgUser, peer, needAmount) => {
  let sellAmount = 0
  const user = await db.User.get(tgUser)
  const portfolio = await db.Portfolio.getByStockUser(tgUser, peer)

  if (portfolio.length > 0) {
    portfolio.forEach((share) => {
      if (sellAmount >= needAmount) return
      if (share.amount <= (needAmount - sellAmount)) {
        share.remove()
        sellAmount += share.amount
      }
      else {
        // eslint-disable-next-line no-param-reassign
        share.amount -= (needAmount - sellAmount)
        share.save()
        sellAmount += (needAmount - sellAmount)
      }
    })

    if (sellAmount > 0) {
      // eslint-disable-next-line max-len
      user.balance += (portfolio.stock.price * sellAmount) - (portfolio.stock.price * global.gameConfig.sellFee)
      user.save()
    }

    return {
      stock: portfolio.stock,
      amount: sellAmount,
      costBasis: portfolio[0].costBasis,
    }
  }

  return {
    error: 'NOT_FOUND',
  }
}

db.Stock.get = async (peer) => {
  const username = peer.match(/(?:\$(\w{2,32})|(?:(?:t\.me)\/|@)(\w{2,32}))/)

  let stock

  if (!username) stock = await db.Stock.findOne({ username: { $regex: `^${peer}$`, $options: 'i' } })
  else if (username[1]) stock = await db.Stock.findOne({ symbol: username[1].toUpperCase() })
  else if (username[2]) stock = await db.Stock.findOne({ username: { $regex: `^${username[2]}$`, $options: 'i' } })

  if (!stock && username && username[2]) {
    // return {
    //   error: 'NOT_FOUND',
    // }

    const channel = await channelParse(username[2])

    if (channel.type === 'channel') {
      const symbol = channel.Chat.username.replace(/[_aeiou0-9]/ig, '').substr(0, 5).toUpperCase()

      stock = new db.Stock()
      stock.channelId = channel.channel_id
      stock.symbol = symbol
      stock.username = channel.Chat.username
      stock.title = channel.Chat.title
      await stock.save()
    }
  }

  return stock
}

db.Stock.update = async (peer) => {
  const channel = await channelParse(peer)

  let totalMessage = 0
  let totalViews = 0

  const nowUnix = Math.floor(Date.now() / 1000)

  channel.messages.forEach((message) => {
    if (!message.fwd_from && message.date < (nowUnix - (3600 * 2)) && totalMessage < 50) {
      if (message.views) {
        totalMessage++
        totalViews += message.views
      }
    }
  })

  const stockPorfolio = await db.Portfolio.getByStockAll(peer)
  const viewsAvg = totalViews / totalMessage

  let price = ((channel.full.participants_count / 25000) * (viewsAvg / 50000)) / 1000

  if (stockPorfolio.length > 0) {
    let portfolioTotalCost = 0

    stockPorfolio.forEach((share) => {
      portfolioTotalCost += share.costBasis * share.amount
    })

    price += ((portfolioTotalCost * (global.gameConfig.sellFee / 100000)) * price)
  }

  const stock = await db.Stock.get(peer)

  stock.title = channel.Chat.title

  if (price < 0 || Number.isNaN(price)) price = 0
  price = parseFloat(price.toFixed(5))

  if (stock.price !== price) {
    const history = new db.History()

    history.stock = stock
    history.price = price
    await history.save()
    stock.price = price
  }

  const now = new Date()
  const gte = new Date(now - (((24 * 60) * 60) * 1000))
  const lte = new Date(now)

  const his = await db.History.find({
    stock: stock.id,
    time: {
      $gte: gte,
      $lte: lte,
    },
  }).sort({ time: 1 })

  if (his.length > 1) {
    const labels = []
    const data = []

    his.forEach((h) => {
      labels.push(dateFormat(h.time, 'H:MM'))
      data.push(h.price)
    })

    const image = await chartGenerate(stock.symbol, data, labels)
    const upload = await uploadFile(image)

    if (upload.error) console.error('telegra.ph:', upload)
    else stock.stats.day.chart = `telegra.ph${upload[0].src}`

    const costBasis = his[0].price
    const profitMoney = price - costBasis
    const profitProcent = (profitMoney / costBasis) * 100

    stock.stats.day.profitMoney = profitMoney
    stock.stats.day.profitProcent = profitProcent
  }

  await stock.save()

  return stock
}

module.exports = {
  db,
}
