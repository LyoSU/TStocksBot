module.exports = async (ctx) => {
  let peer = ''

  if (ctx.match[2] === '/s_') ctx.message.text = ctx.message.text.replace('/s_', '$')
  // eslint-disable-next-line prefer-destructuring
  if (ctx.callbackQuery) peer = ctx.match[1]
  else peer = ctx.message.text

  const stock = await ctx.db.Stock.get(peer)
  const portfolio = await ctx.db.User.Portfolio.getByPeer(ctx.from, peer)

  let shares = ctx.i18n.t('stock.error.no_shares')

  if (stock) {
    if (portfolio.length > 0) {
      let basicCost = 0

      portfolio.forEach((el) => {
        basicCost += el.costBasis
      })

      const costAvrg = basicCost / portfolio.length
      const profitMoney = stock.price - costAvrg
      const profitProcent = (profitMoney / costAvrg) * 100

      shares = ctx.i18n.t('stock.shares', {
        shares: portfolio.length,
        basicCost: basicCost.toFixed(5),
        cost: (portfolio.length * stock.price).toFixed(5),
        profitMoney: profitMoney.toFixed(5),
        profitProcent: profitProcent.toFixed(5),
      })
    }

    const text = ctx.i18n.t('stock.info', {
      title: stock.title,
      username: stock.username,
      symbol: stock.symbol,
      price: stock.price,
      chart: stock.charts.day,
      shares,
    })

    const markup = {
      inline_keyboard: [
        [
          {
            text: ctx.i18n.t('stock.btn.update'),
            callback_data: `stock.update:${stock.username}`,
          },
        ],
        [
          {
            text: ctx.i18n.t('stock.btn.buy'),
            callback_data: `stock.buy:${stock.username}:1`,
          },
          {
            text: ctx.i18n.t('stock.btn.sell'),
            callback_data: `stock.sell:${stock.username}:1`,
          },
        ],
      ],
    }

    if (ctx.callbackQuery) {
      ctx.answerCbQuery('')
      ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: markup,
      }).catch((error) => {
        if (error.description === 'Bad Request: message is not modified') return ''
        return console.log('Ooops', error)
      })
    }
    else {
      ctx.replyWithHTML(text, {
        reply_markup: markup,
      })
    }
  }
}
