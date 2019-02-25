const User = require('../models/user')


module.exports = async (ctx) => {
  if (ctx.chat.type === 'private') {
    await User.dbUpdate(ctx)
  }
}
