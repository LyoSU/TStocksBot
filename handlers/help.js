const Markup = require('telegraf/markup')


module.exports = async (ctx) => {
  ctx.replyWithHTML(ctx.i18n.t('help.info'), Markup.keyboard([
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
