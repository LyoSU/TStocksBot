const path = require('path')
const Telegraf = require('telegraf')
const rateLimit = require('telegraf-ratelimit')
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
  handleSell,
  handleTop,
  handlePortfolio,
} = require('./handlers')
const {
  cronStockUpdate,
} = require('./cron')


global.gameConfig = {
  sellFee: 0.25,
}

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.context.db = models

const i18n = new I18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'ru',
})

bot.use(i18n.middleware())

const moneyLimitConfig = rateLimit({
  window: 1000,
  limit: 1,
})

bot.use(async (ctx, next) => {
  ctx.ms = new Date()
  await userUpdate(ctx)
  await next(ctx)
  const ms = new Date() - ctx.ms

  console.log('Response time %sms', ms)
})

bot.command('top', handleTop)
bot.command('portfolio', handlePortfolio)

bot.hears(/(?:\$(\w{2,32})|(?:(?:t\.me)\/|(\/s_|@))(\w{2,32}))/, handleStock)

bot.action(/stock.update:(\w+)/, handleStock)
bot.action(/stock.amount:(\w+):(\d+)/)
bot.action(/stock.buy:(\w+):(\d+)/, rateLimit(moneyLimitConfig), handleBuy)
bot.action(/stock.sell:(\w+):(\d+)/, rateLimit(moneyLimitConfig), handleSell)

bot.on('text', handleProfile)

bot.launch()

console.log('bot start')

cronStockUpdate()
