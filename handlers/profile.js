const { userName } = require('../utils')


module.exports = async (ctx) => {
  ctx.session = null
  ctx.replyWithHTML(ctx.i18n.t('profile', {
    name: userName(ctx.from),
    balance: ctx.user.balance,
  }))
}
