const dateFormat = require('dateformat')
const request = require('request-promise')
const fs = require('fs')
const stream = require('stream')
const { CanvasRenderService } = require('chartjs-node-canvas')


const width = 400
const height = 400
const configuration = {
  type: 'bar',
  data: {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange', 'Test'],
    datasets: [{
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3, 5, 1, 6, 8],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
      ],
      borderColor: [
        'rgba(255,99,132,1)',
      ],
      borderWidth: 1,
    }],
  },
  options: {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
        },
      }],
    },
  },
}

module.exports = async (ctx) => {
  const arg = ctx.message.text.split(/ +/)
  const stock = await ctx.db.Stock.get(arg[1])

  const canvasRenderService = new CanvasRenderService(width, height)
  const image = await canvasRenderService.renderToBuffer(configuration)
  const dataUrl = await canvasRenderService.renderToDataURL(configuration)

  const bufferStream = new stream.PassThrough()
  bufferStream.end(image)

  console.log(bufferStream)

  const fileName = 'tmp/out.png'

  const stream = fs.createReadStream(fileName)

  console.log(image)
  console.log(stream)

  await fs.writeFile(fileName, image, (err) => {
    if (err) console.log(err)
  })

  const formData = {
    file: stream,
  }

  request.post({ url: 'https://telegra.ph/upload', formData }, (err, httpResponse, body) => {
    if (err) {
      console.error('upload failed:', err)
    }
    console.log('Upload successful!  Server responded with:', body)
  })

  let priceHistory = ''

  stock.history.forEach((h) => {
    priceHistory += `${h.price} - ${dateFormat(h.time, 'H:MM')}\n`
  })

  ctx.replyWithHTML(ctx.i18n.t('stock.info', {
    title: stock.title,
    username: stock.username,
    symbol: stock.symbol,
    price: stock.price,
    priceHistory,
  }))
}
