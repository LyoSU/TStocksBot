const dateFormat = require('dateformat')
const { CanvasRenderService } = require('chartjs-node-canvas')
const { uploadFile } = require('../utils')


module.exports = async (ctx) => {
  const arg = ctx.message.text.split(/ +/)
  const stock = await ctx.db.Stock.get(arg[1])
  const labels = []
  const data = []

  const now = new Date()
  const gte = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lte = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const his = await ctx.db.Stock.aggregate([{
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
  const chart = `telegra.ph${upload[0].src}`

  ctx.replyWithHTML(ctx.i18n.t('stock.info', {
    title: stock.title,
    username: stock.username,
    symbol: stock.symbol,
    price: stock.price,
    chart,
  }))
}
