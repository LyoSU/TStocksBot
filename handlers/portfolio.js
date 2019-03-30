const {
  userName,
} = require.main.require('./utils')


module.exports = async (ctx) => {
  const portfolioGet = await ctx.db.User.Portfolio.getByUser(ctx.from)
  let resultText = ''

  if (portfolioGet.length > 0) {
    const portfolioStock = {}
    let portfolio = ''

    portfolioGet.forEach((share) => {
      if (!portfolioStock[share.stock.id]) {
        portfolioStock[share.stock.id] = {
          count: 0,
          cost: 0,
          stock: share.stock,
        }
      }
      portfolioStock[share.stock.id].count++
      portfolioStock[share.stock.id].cost += share.costBasis
    })

    Object.keys(portfolioStock).forEach((stockId) => {
      const baseCost = portfolioStock[stockId].cost
      const cost = portfolioStock[stockId].stock.price * portfolioStock[stockId].count

      portfolio += ctx.i18n.t('portfolio.stock', {
        symbol: portfolioStock[stockId].stock.symbol,
        baseCost: baseCost.toFixed(5),
        cost: cost.toFixed(5),
      })
    })

    resultText = ctx.i18n.t('portfolio.info', {
      name: userName(ctx.from),
      portfolio,
    })
  }
  else {
    resultText = ctx.i18n.t('portfolio.error.empty')
  }

  ctx.replyWithHTML(resultText)
}
