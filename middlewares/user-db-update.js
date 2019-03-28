module.exports = async (ctx) => {
  if (ctx.chat.type === 'private') {
    ctx.user = await ctx.db.User.get(ctx.from)
  }
}
