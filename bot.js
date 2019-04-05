const path = require('path')
const Telegraf = require('telegraf')
const RedisSession = require('telegraf-session-redis')
const rateLimit = require('telegraf-ratelimit')
const I18n = require('telegraf-i18n')
const {
  db,
} = require('./database')
const {
  userUpdate,
} = require('./middlewares')
const {
  handleProfile,
  handleStock,
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

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

const session = new RedisSession({
  store: {
    prefix: 'TStocksBot:',
  },
})

bot.use(session)

bot.context.db = db

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

bot.hears(['/top', 'Топ'], handleTop)
bot.hears(['/portfolio', 'Портфолио'], handlePortfolio)

bot.hears(/(?:\$(\w{2,32})|(?:(?:t\.me)\/|(\/s_|@))(\w{2,32}))/, handleStock)

bot.action(/stock:(.*)/, rateLimit(moneyLimitConfig), handleStock)

bot.on('text', handleProfile)

// bot.catch((error) => {
//   console.log('Ooops', error)
// })

bot.launch()

console.log('bot start')

cronStockUpdate()
