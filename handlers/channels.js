module.exports = async (ctx) => {
  const getTop = await ctx.db.Stock.getTop(0, 25)
  let num = 1
  let channelsText = ''

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
