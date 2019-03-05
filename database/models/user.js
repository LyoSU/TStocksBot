const mongoose = require('mongoose')
const Float = require('mongoose-float').loadType(mongoose, 5)


const userSchema = mongoose.Schema({
  telegram_id: {
    type: Number,
    index: true,
    unique: true,
    required: true,
  },
  first_name: String,
  last_name: String,
  username: String,
  balance: {
    type: Float,
    default: 1.00000000,
  },
}, {
  timestamps: true,
})

const User = mongoose.model('User', userSchema)

User.get = async (ctx) => {
  let user = await User.findOne({ telegram_id: ctx.from.id })

  if (!user) {
    user = new User()
    user.telegram_id = ctx.from.id
  }
  user.first_name = ctx.from.first_name
  user.last_name = ctx.from.last_name
  user.username = ctx.from.username
  user.updatedAt = new Date()
  await user.save()

  return user
}

module.exports = User
