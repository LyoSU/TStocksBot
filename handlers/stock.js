module.exports = async (ctx) => {
  let answerText = ''
  let showAlert = false
  let peer = ''

  if (ctx.callbackQuery) {
    peer = `$${ctx.match[2]}`
    let result = ''

    switch (ctx.match[1]) {
      case 'update':
        answerText = ctx.i18n.t('stock.answer.update.suc')
        break
      case 'buy':
        result = await ctx.db.User.Portfolio.buy(ctx.from, peer, ctx.match[3])

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
        break
      case 'sell':

        result = await ctx.db.User.Portfolio.sell(ctx.from, peer, ctx.match[3])

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
        break
      default:
        answerText = ctx.i18n.t('error.unknown')
        showAlert = true
    }
  }

  if (ctx.message) {
    if (ctx.match[2] === '/s_') ctx.message.text = ctx.message.text.replace('/s_', '')
    peer = `$${ctx.message.text}`
  }

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
            callback_data: `stock.update:${stock.symbol}:0`,
          },
        ],
        [
          {
            text: ctx.i18n.t('stock.btn.buy'),
            callback_data: `stock.buy:${stock.symbol}:1`,
          },
          {
            text: ctx.i18n.t('stock.btn.sell'),
            callback_data: `stock.sell:${stock.symbol}:1`,
          },
        ],
      ],
    }

    if (ctx.callbackQuery) {
      ctx.editMessageText(text, {
        parse_mode: 'HTML',
        reply_markup: markup,
      }).catch((error) => {
        if (error.description === 'Bad Request: message is not modified') return ''
        return console.log('Ooops', error)
      })

      ctx.answerCbQuery(answerText, showAlert)
    }
    else {
      ctx.replyWithHTML(text, {
        reply_markup: markup,
      })
    }
  }
}
