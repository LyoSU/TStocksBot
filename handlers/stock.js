module.exports = async (ctx) => {
  const arg = ctx.message.text.split(/ +/)
  const stock = await ctx.db.Stock.get(arg[1])

  ctx.replyWithHTML(ctx.i18n.t('stock.info', {
    title: stock.title,
    username: stock.username,
    symbol: stock.symbol,
    price: stock.price,
    chart: stock.chart,
  }))
}
