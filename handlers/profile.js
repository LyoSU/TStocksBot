const humanizeDuration = require('humanize-duration')
const Markup = require('telegraf/markup')
const { userName } = require('../utils')


module.exports = async (ctx) => {
  const value = await ctx.db.Portfolio.getValue(ctx.from)

  const accountAge = humanizeDuration(
    new Date() - ctx.user.createdAt,
    {
      round: true,
      largest: 2,
      language: ctx.i18n.locale(),
    }
  )

  console.log(value)

  ctx.replyWithHTML(ctx.i18n.t('profile.info', {
    name: userName(ctx.from),
    balance: ctx.user.balance,
    shares: value.shares,
    costBasis: value.costBasis,
    cost: value.cost,
    profitMoney: value.profitMoney,
    profitProcent: value.profitProcent,
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

  ctx.session = null
}
