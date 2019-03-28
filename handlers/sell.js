module.exports = async (ctx) => {
  let answerText = ''
  let showAlert = false
  const result = await ctx.db.User.Portfolio.sell(ctx.from, ctx.match[1], ctx.match[2])

  if (result.stock) {
    answerText = ctx.i18n.t('stock.answer.sell.suc', {
      symbol: result.stock.symbol,
    })
  }
  else if (result.error === 'NOT_FOUND') {
    answerText = ctx.i18n.t('stock.answer.sell.error.not_found')
    showAlert = true
  }
  else {
    answerText = ctx.i18n.t('error.unknown')
    showAlert = true
  }

  ctx.answerCbQuery(answerText, showAlert)
}
