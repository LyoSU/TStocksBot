const Markup = require('telegraf/markup')


module.exports = async (ctx) => {
  const signType = ['plus', 'minus']

  if (ctx.session.stack === undefined) {
    ctx.session.stack = {}
    ctx.session.stack.amount = 1
    ctx.session.stack.sign = 'plus'
  }

  let answerText = ''
  let showAlert = false
  let peer = ''
  let arg

  if (ctx.callbackQuery) {
    arg = ctx.match[1].split('.')
    peer = `$${arg[0]}`
  }
  else if (ctx.message) {
    if (ctx.match[2] === '/s_') {
      ctx.message.text = ctx.message.text.replace('/s_', '')
      peer = `$${ctx.message.text}`
    }
    else {
      peer = ctx.message.text
    }
  }

  const stock = await ctx.db.Stock.get(peer)

  if (stock && !stock.error) {
    const portfolios = await ctx.db.Portfolio.getByStockUser(ctx.from, peer)

    let amountTotal = 0
    let costBasis = 0
    let profitMoney = 0
    let profitProcent = 0

    if (portfolios.length > 0) {
      portfolios.forEach((share) => {
        amountTotal += share.amount
        costBasis += share.costBasis * share.amount
      })
    }

    if (ctx.callbackQuery) {
      let result = ''

      switch (arg[1]) {
        case 'amount': {
          answerText = ''

          if (arg[2] === 'plus') ctx.session.stack.sign = 'minus'
          else if (arg[2] === 'minus') ctx.session.stack.sign = 'plus'
          else if (ctx.session.stack.sign === 'plus') ctx.session.stack.amount += parseInt(arg[2], 10)
          else if (ctx.session.stack.sign === 'minus') ctx.session.stack.amount -= parseInt(arg[2], 10)

          if (ctx.session.stack.amount < 1) ctx.session.stack.amount = 1

          break
        }
        case 'update': {
          answerText = ctx.i18n.t('stock.answer.update.suc')
          break
        }
        case 'buy': {
          const amount = parseInt(arg[2], 10)

          result = await ctx.db.Portfolio.buy(ctx.from, peer, amount)

          if (result.portfolio) {
            answerText = ctx.i18n.t('stock.answer.buy.suc', {
              symbol: result.portfolio.stock.symbol,
              amount: result.amount,
            })

            amountTotal += result.amount
            costBasis += result.costBasis * result.amount
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
        }
        case 'sell': {
          result = await ctx.db.Portfolio.sell(ctx.from, peer, parseInt(arg[2], 10))

          if (result.stock) {
            answerText = ctx.i18n.t('stock.answer.sell.suc', {
              symbol: result.stock.symbol,
              amount: result.amount,
            })

            amountTotal -= result.amount
            costBasis -= result.costBasis * result.amount
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
        }
        default: {
          answerText = ctx.i18n.t('error.unknown')
          showAlert = true
        }
      }
    }


    let shares = ctx.i18n.t('stock.error.no_shares')

    if (amountTotal > 0) {
      profitMoney = (stock.price * amountTotal) - costBasis
      profitProcent = (profitMoney / costBasis) * 100

      shares = ctx.i18n.t('stock.shares', {
        shares: amountTotal,
        costBasis: costBasis.toFixed(5),
        cost: (amountTotal * stock.price).toFixed(5),
        profitMoney: profitMoney.toFixed(5),
        profitProcent: profitProcent.toFixed(5),
      })
    }

    const text = ctx.i18n.t('stock.info', {
      title: stock.title,
      username: stock.username,
      symbol: stock.symbol,
      price: stock.price,
      chart: stock.stats.day.chart,
      profitMoney: stock.stats.day.profitMoney.toFixed(5),
      profitProcent: stock.stats.day.profitProcent.toFixed(5),
      shares,
    })

    const markup = Markup.inlineKeyboard([
      [
        Markup.callbackButton((ctx.session.stack.sign === 'plus' ? '+' : '-'), `stock:${stock.symbol}.amount.${ctx.session.stack.sign === 'plus' ? signType[0] : signType[1]}`),
        Markup.callbackButton('1', `stock:${stock.symbol}.amount.1`),
        Markup.callbackButton('10', `stock:${stock.symbol}.amount.10`),
        Markup.callbackButton('100', `stock:${stock.symbol}.amount.100`),
        Markup.callbackButton('1000', `stock:${stock.symbol}.amount.1000`),
      ],
      [
        Markup.callbackButton(ctx.i18n.t('stock.btn.buy'), `stock:${stock.symbol}.buy.${ctx.session.stack.amount}`),
        Markup.callbackButton(`[${ctx.session.stack.amount}]`, `stock:${stock.symbol}.update`),
        Markup.callbackButton(ctx.i18n.t('stock.btn.sell'), `stock:${stock.symbol}.sell.${ctx.session.stack.amount}`),
      ],
      [
        Markup.callbackButton(ctx.i18n.t('stock.btn.update'), `stock:${stock.symbol}.update`),
      ],
    ])

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
  else {
    ctx.replyWithHTML(ctx.i18n.t('stock.error.not_found'))
  }
}
