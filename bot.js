const mongoose = require('mongoose')
const path = require('path')
const Telegraf = require('telegraf')
const I18n = require('telegraf-i18n')
const {
  userUpdate,
} = require('./middlewares')
const {
  handleProfile,
  handleStock,
} = require('./handlers')


mongoose.connect(process.env.MONGODB_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
})

const db = mongoose.connection

db.on('error', (err) => {
  console.log('error', err)
})

const i18n = new I18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'ru',
})

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(i18n.middleware())

bot.use(async (ctx, next) => {
  ctx.ms = new Date()
  await userUpdate(ctx)
  await next(ctx)
  const ms = new Date() - ctx.ms

  console.log('Response time %sms', ms)
})

bot.command('stock', handleStock)
bot.on('text', handleProfile)

bot.launch()
