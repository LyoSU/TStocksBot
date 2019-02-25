const request = require('request')
const Stock = require('../models/stock')


module.exports = async (ctx) => {
  const arg = ctx.message.text.split(/ +/)

  const channelId = arg[1]

  await request(`${process.env.TGSTAT_URI}/channels/stat?channelId=${channelId}&token=${process.env.TGSTAT_TOKEN}`, { json: true }, async (err, res, body) => {
    if (body.status === 'ok') {
      const channel = body.response
      const symbol = channel.username.replace(/[_aeiou0-9]/ig, '').substr(0, 5).toUpperCase()
      const price = ((channel.participants_count / 100000) * (channel.daily_reach / 10000)) / channel.err_percent

      let stock = await Stock.findOne({ username: channel.username })

      if (!stock) {
        stock = new Stock()
        stock.tgstatId = channel.id
        stock.symbol = symbol
        stock.username = channel.username
      }
      stock.title = channel.title
      stock.price = price
      stock.save()

      console.log(channel)
      ctx.replyWithHTML(ctx.i18n.t('stock.info', {
        title: channel.title,
        username: channel.username,
        symbol,
        price: price.toFixed(5),
      }))
    }
    else if (body.error === 'channel_not_found') {
      ctx.replyWithHTML(ctx.i18n.t('stock.error.not_found'))
    }
    else {
      const adminId = 66478514

      ctx.telegram.sendMessage(adminId, `Error:\n${body.error}`)
    }
  })
}
