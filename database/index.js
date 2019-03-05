const mongoose = require('mongoose')
const models = require('./models')


mongoose.connect(process.env.MONGODB_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
})

const db = mongoose.connection

db.on('error', (err) => {
  console.log('error', err)
})


module.exports = {
  db,
  models,
}
