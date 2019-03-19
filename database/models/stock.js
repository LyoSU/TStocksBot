const {
  channelParse,
  uploadFile,
} = require.main.require('./utils')
const dateFormat = require('dateformat')
const { CanvasRenderService } = require('chartjs-node-canvas')
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
  history: [historySchema],
  chart: String,
}, {
  timestamps: true,
})

const Stock = mongoose.model('Stock', stockSchema)

Stock.get = async (peer) => {
  const username = peer.match(/(?:\$(\w{2,32})|(?:(?:t\.me)\/|@)(\w{2,32}))/)

  let stock

  if (!username) stock = await Stock.findOne({ username: { $regex: new RegExp(peer, 'i') } })
  else if (username[1]) stock = await Stock.findOne({ symbol: username[1].toUpperCase() })
  else if (username[2]) stock = await Stock.findOne({ username: { $regex: new RegExp(username[2], 'i') } })

  if (!stock && username[2]) {
    const channel = await channelParse(username[2])

    if (channel.type === 'channel') {
      const symbol = channel.Chat.username.replace(/[_aeiou0-9]/ig, '').substr(0, 5).toUpperCase()

      stock = new Stock()
      stock.channelId = channel.channel_id
      stock.symbol = symbol
      stock.username = channel.Chat.username
      stock.title = channel.Chat.title
      await stock.save()
    }
  }

  return stock
}

Stock.update = async (peer) => {
  const channel = await channelParse(peer)

  let totalMessage = 0
  let totalViews = 0

  const nowUnix = Math.floor(Date.now() / 1000)

  await channel.messages.forEach((message) => {
    if (!message.fwd_from && message.date < (nowUnix - (3600 * 3))) {
      if (message.views) {
        totalMessage++
        totalViews += message.views
      }
    }
  })

  const viewsAvg = totalViews / totalMessage

  let price = ((channel.full.participants_count / 10000) * (viewsAvg / 10000)) / 100

  price = parseFloat(price.toFixed(5))

  const stock = await Stock.get(peer)

  stock.title = channel.Chat.title
  if (stock.price !== price) {
    stock.price = price
    stock.history.push({ price, time: new Date() })
  }

  const now = new Date()
  const gte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const lte = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const his = await Stock.aggregate([{
    $match: {
      username: stock.username,
      'history.time': {
        $gte: gte,
        $lte: lte,
      },
    },
  }, {
    $project: {
      history: {
        $filter: {
          input: '$history',
          as: 'history',
          cond: {
            $and: [
              { $gte: ['$$history.time', gte] },
              { $lte: ['$$history.time', lte] },
            ],
          },
        },
      },
    },
  }])

  if (his[0] && his[0].history.length > 1) {
    const labels = []
    const data = []

    his[0].history.forEach((h) => {
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

    stock.chart = `telegra.ph${upload[0].src}`
  }

  await stock.save()

  return stock
}

module.exports = Stock
