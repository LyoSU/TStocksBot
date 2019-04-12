module.exports = async (ctx) => {
  const topUser = JSON.parse(await ctx.redis.get('topUser'))
  let num = 1
  let topText = ''

  if (topUser && topUser.length > 5) {
    topUser.forEach((user) => {
      topText += ctx.i18n.t('top.user', {
        num: `${num++}. `,
        name: user.name,
        capital: user.capital.toFixed(5),
      })
    })

    ctx.replyWithHTML(ctx.i18n.t('top.info', { topText }))
  }
  else ctx.replyWithHTML(ctx.i18n.t('top.error.empty'))
}
