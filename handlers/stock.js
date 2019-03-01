const dateFormat = require('dateformat')


module.exports = async (ctx) => {
  const arg = ctx.message.text.split(/ +/)
  const stock = await ctx.db.Stock.get(arg[1])

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
