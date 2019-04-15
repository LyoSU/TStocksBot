module.exports = async (ctx) => {
  let num = 1
  let channelsText = ''

  const getTop = await ctx.db.Stock.find({ available: true }).skip(0).limit(25).sort({ price: -1 })

  getTop.forEach((stock) => {
    channelsText += ctx.i18n.t('channels.stock', {
      num: `${num++}. `,
      symbol: stock.symbol,
      price: stock.price,
      profitProcent: stock.stats.day.profitProcent.toFixed(2),
    })
  })

  ctx.replyWithHTML(ctx.i18n.t('channels.info', { channelsText }))
}
