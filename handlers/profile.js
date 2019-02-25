const { userName } = require('../function')


module.exports = async (ctx) => {
  ctx.user.balance -= 0.00001

  console.log(ctx.user.balance)
  ctx.user.save()
  ctx.replyWithHTML(ctx.i18n.t('profile', {
    name: userName(ctx.from),
    balance: ctx.user.balance,
  }))
}
