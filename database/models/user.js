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
    default: 100,
  },
  admin_rights: {
    add_admin: Boolean,
  },
}, {
  timestamps: true,
})


module.exports = userSchema
