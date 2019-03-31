module.exports = async (ctx) => {
  const getTop = await ctx.db.Stock.getTop()
  let topText = ''

  getTop.forEach((stock) => {
    topText += ctx.i18n.t('top.stock', {
      symbol: stock.symbol,
      price: stock.price,
    })
  })

  ctx.replyWithHTML(ctx.i18n.t('top.info', { topText }))
}
