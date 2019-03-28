module.exports = async (ctx) => {
  let answerText = ''
  let showAlert = false
  const result = await ctx.db.User.Portfolio.buy(ctx.from, ctx.match[1], ctx.match[2])

  if (result.portfolio) {
    answerText = ctx.i18n.t('stock.answer.buy.suc', {
      symbol: result.portfolio.stock.symbol,
    })
  }
  else if (result.error === 'MONEY_ERROR') {
    answerText = ctx.i18n.t('stock.answer.buy.error.money')
    showAlert = true
  }
  else {
    answerText = ctx.i18n.t('error.unknown')
    showAlert = true
  }

  ctx.answerCbQuery(answerText, showAlert)
}
