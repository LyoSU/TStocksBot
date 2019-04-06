module.exports = async (ctx) => {
  const getTop = await ctx.db.Stock.getTop()
  let channelsText = ''

  getTop.forEach((stock) => {
    channelsText += ctx.i18n.t('channels.stock', {
      symbol: stock.symbol,
      price: stock.price,
    })
  })

  ctx.replyWithHTML(ctx.i18n.t('channels.info', { channelsText }))
}
