module.exports = async (ctx) => {
  const stock = await ctx.db.Stock.get(ctx.message.text)

  if (stock) {
    ctx.replyWithHTML(ctx.i18n.t('stock.info', {
      title: stock.title,
      username: stock.username,
      symbol: stock.symbol,
      price: stock.price,
      chart: stock.chart,
    }))
  }
}
