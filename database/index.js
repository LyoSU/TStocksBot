const {
  channelParse,
  uploadFile,
} = require.main.require('./utils')
const dateFormat = require('dateformat')
const { CanvasRenderService } = require('chartjs-node-canvas')
const collections = require('./collections')
const connection = require('./connection')


const db = {}

Object.keys(collections).forEach((collectionName) => {
  db[collectionName] = connection.model(collectionName, collections[collectionName])
})


db.User.get = async (tgUser) => {
  let user = await db.User.findOne({ telegram_id: tgUser.id })

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

db.Portfolio.getByPeer = async (tgUser, peer) => {
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

db.Portfolio.getByStock = async (peer) => {
  const stock = await db.Stock.get(peer)
  const portfolio = await db.Portfolio.find({
    stock,
  }).sort({ costBasis: -1 }).populate('stock')

  return portfolio
}

db.Portfolio.buy = async (tgUser, peer, amount) => {
  const user = await db.User.get(tgUser)
  const stock = await db.Stock.get(peer)

  if (user.balance >= stock.price) {
    user.balance -= stock.price
    user.save()

    const portfolio = new db.Portfolio()

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

db.Portfolio.sell = async (tgUser, peer, amount) => {
  let sellAmount = 0
  const user = await db.User.get(tgUser)
  const portfolio = await db.Portfolio.getByPeer(tgUser, peer)

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

db.Stock.get = async (peer) => {
  const username = peer.match(/(?:\$(\w{2,32})|(?:(?:t\.me)\/|@)(\w{2,32}))/)

  let stock

  if (!username) stock = await db.Stock.findOne({ username: { $regex: new RegExp(peer, 'i') } })
  else if (username[1]) stock = await db.Stock.findOne({ symbol: username[1].toUpperCase() })
  else if (username[2]) stock = await db.Stock.findOne({ username: { $regex: new RegExp(username[2], 'i') } })

  if (!stock && username && username[2]) {
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


db.Stock.getTop = async () => {
  const stock = await db.Stock.find().skip(0).limit(10).sort({ price: -1 })

  return stock
}

db.Stock.update = async (peer) => {
  const channel = await channelParse(peer)

  let totalMessage = 0
  let totalViews = 0

  const nowUnix = Math.floor(Date.now() / 1000)

  await channel.messages.forEach((message) => {
    if (!message.fwd_from && message.date < (nowUnix - 3600)) {
      if (message.views) {
        totalMessage++
        totalViews += message.views
      }
    }
  })

  const stockPorfolio = await db.Portfolio.getByStock(peer)
  const viewsAvg = totalViews / totalMessage

  let price = ((channel.full.participants_count / 25000) * (viewsAvg / 50000)) / 1000

  price += (price * (stockPorfolio.length / 7500))
  price = parseFloat(price.toFixed(5))

  const stock = await db.Stock.get(peer)

  stock.title = channel.Chat.title
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
  })

  if (his.length > 1) {
    const labels = []
    const data = []

    his.forEach((h) => {
      labels.push(dateFormat(h.time, 'H:MM'))
      data.push(h.price)
    })

    const canvasRenderService = new CanvasRenderService(1200, 600)

    const configuration = {
      backgroundColor: 'rgba(48, 160, 214, 1)',
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: 'rgba(48, 160, 214, 0.2)',
          borderColor: 'rgba(48, 160, 214, 1)',
        }],
      },
      options: {
        title: {
          display: true,
          fontSize: 25,
          fontColor: 'rgba(48, 160, 214, 1)',
          text: stock.symbol,
        },
        legend: {
          display: false,
        },
      },
    }

    const image = await canvasRenderService.renderToBuffer(configuration)
    const upload = await uploadFile(image)

    stock.charts.day = `telegra.ph${upload[0].src}`
  }

  await stock.save()

  return stock
}

module.exports = {
  db,
}
