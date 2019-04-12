const {
  userName,
} = require.main.require('./utils')


module.exports = async (ctx) => {
  const portfolio = await ctx.db.Portfolio.getByUser(ctx.from)
  let resultText = ''

  if (portfolio.length > 0) {
    const portfolioStock = {}
    let portfolioText = ''

    portfolio.forEach((share) => {
      if (!portfolioStock[share.stock.id]) {
        portfolioStock[share.stock.id] = {
          amount: 0,
          costBasis: 0,
          stock: share.stock,
        }
      }
      portfolioStock[share.stock.id].amount += share.amount
      portfolioStock[share.stock.id].costBasis += share.costBasis * share.amount
    })

    Object.keys(portfolioStock).forEach((stockId) => {
      const stock = portfolioStock[stockId]
      const cost = stock.stock.price * stock.amount
      const profitMoney = cost - stock.costBasis
      const profitProcent = (profitMoney / stock.costBasis) * 100

      portfolioText += ctx.i18n.t('portfolio.stock', {
        symbol: stock.stock.symbol,
        costBasis: stock.costBasis.toFixed(5),
        cost: cost.toFixed(5),
        profitProcent,
      })
    })

    resultText = ctx.i18n.t('portfolio.info', {
      name: userName(ctx.from),
      portfolioText,
    })
  }
  else {
    resultText = ctx.i18n.t('portfolio.error.empty')
  }

  ctx.replyWithHTML(resultText)
}
