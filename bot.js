const path = require('path')
const Telegraf = require('telegraf')
const I18n = require('telegraf-i18n')
const {
  models,
} = require('./database')
const {
  userUpdate,
} = require('./middlewares')
const {
  handleProfile,
  handleStock,
  handleBuy,
} = require('./handlers')
const {
  cronStockUpdate,
} = require('./cron')


cronStockUpdate()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.context.db = models

const i18n = new I18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'ru',
})

bot.use(i18n.middleware())

bot.use(async (ctx, next) => {
  ctx.ms = new Date()
  await userUpdate(ctx)
  await next(ctx)
  const ms = new Date() - ctx.ms

  console.log('Response time %sms', ms)
})

bot.hears(/(?:\$(\w{2,32})|(?:(?:t\.me)\/|@)(\w{2,32}))/, handleStock)
bot.action(/stock.amount:(\w+):(\d+)/)
bot.action(/stock.buy:(\w+):(\d+)/, handleBuy)

bot.on('text', handleProfile)

bot.launch()

console.log('bot start')
