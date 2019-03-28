const { userName } = require('../utils')


module.exports = async (ctx) => {
  ctx.replyWithHTML(ctx.i18n.t('profile', {
    name: userName(ctx.from),
    balance: ctx.user.balance,
  }))
}
