const {
  getMembers,
  tgstat,
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
  chart: String,
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

Stock.update = async (channelId) => {
  const channel = await tgstat(channelId)
  const members = await getMembers(channel.username)
  let price = ((members / (channel.avg_post_reach / 100)) * (channel.daily_reach / 10000)) / 10000

  price = parseFloat(price.toFixed(5))

  const stock = await Stock.get(channel.username)

  stock.title = channel.title
  if (stock.price !== price) {
    stock.price = price
    stock.history.push({ price, time: new Date() })
  }

  const now = new Date()
  const gte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6)
  const lte = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 6)
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

  if (his.length > 0) {
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
          text: stock.title,
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
