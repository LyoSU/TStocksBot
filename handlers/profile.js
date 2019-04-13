const humanizeDuration = require('humanize-duration')
const Markup = require('telegraf/markup')
const { userName } = require('../utils')


module.exports = async (ctx) => {
  ctx.session = null

  const value = await ctx.db.Portfolio.getValue(ctx.from)

  const accountAge = humanizeDuration(
    new Date() - ctx.user.createdAt,
    {
      round: true,
      largest: 2,
      language: ctx.i18n.locale(),
    }
  )

  ctx.replyWithHTML(ctx.i18n.t('profile.info', {
    name: userName(ctx.from),
    balance: ctx.user.balance.toFixed(5),
    shares: value.shares,
    costBasis: value.costBasis.toFixed(5),
    cost: value.cost.toFixed(5),
    profitMoney: value.profitMoney.toFixed(5),
    profitProcent: value.profitProcent.toFixed(2),
    capital: ctx.user.balance + value.cost.toFixed(5),
    accountAge,
  }), Markup.keyboard([
    [
      ctx.i18n.t('profile.btn.profile'),
      ctx.i18n.t('profile.btn.portfolio'),
    ],
    [
      ctx.i18n.t('profile.btn.channels'),
      ctx.i18n.t('profile.btn.top'),
    ],
  ]).resize().extra())
}
