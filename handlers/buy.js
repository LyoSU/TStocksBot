module.exports = async (ctx) => {
  await ctx.db.User.Portfolio.buy(ctx, ctx.match[1], ctx.match[2])

  ctx.answerCbQuery()
}
