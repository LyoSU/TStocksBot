const Markup = require('telegraf/markup')
const { userName } = require('../utils')


module.exports = async (ctx) => {
  ctx.session = null
  ctx.replyWithHTML(ctx.i18n.t('profile.info', {
    name: userName(ctx.from),
    balance: ctx.user.balance,
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
