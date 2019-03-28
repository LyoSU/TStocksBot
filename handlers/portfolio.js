const {
  userName,
} = require.main.require('./utils')


module.exports = async (ctx) => {
  const portfolioGet = await ctx.db.User.Portfolio.getAll(ctx.from)
  let resultText = ''

  if (portfolioGet.length > 0) {
    const portfolioStock = {}
    let portfolio = ''

    portfolioGet.forEach((el) => {
      if (!portfolioStock[el.stock.id]) {
        portfolioStock[el.stock.id] = {
          count: 0,
          cost: 0,
          stock: el.stock,
        }
      }
      portfolioStock[el.stock.id].count++
      portfolioStock[el.stock.id].cost += el.costBasis
    })

    Object.keys(portfolioStock).forEach((stockId) => {
      const baseCost = portfolioStock[stockId].cost
      const cost = portfolioStock[stockId].stock.price * portfolioStock[stockId].count

      portfolio += `\n$${portfolioStock[stockId].stock.symbol} - ${baseCost.toFixed(5)} / ${cost.toFixed(5)}`
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
